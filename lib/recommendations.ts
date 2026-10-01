import { z } from 'zod';
import { readStorage, writeStorage, removeStorage, emitOperation } from './members/storage';
import { dayKey } from './progress';
import type { LearningRecord, LessonSummary, Subject } from './types';

export const DAILY_PLAN_PREFIX = 'fun-learning:daily-plan:v2:';
export const recommendationReasons = {
  new: '探索一个还没练过的知识点',
  weak: '把上次有点难的知识再练一练',
  review: '温故知新，让记忆更牢固',
} as const;
const subjectOrder: Subject[] = ['chinese', 'math', 'english', 'science'];
const itemSchema = z.object({
  lessonId: z.uuid(), subject: z.enum(['chinese', 'math', 'english', 'science']),
  kind: z.enum(['new', 'weak', 'review']),
});
const planSchema = z.object({
  day: z.iso.date(), grade: z.number().int().min(1).max(6),
  items: z.array(itemSchema).max(4),
}).refine(p => new Set(p.items.map(i => i.lessonId)).size === p.items.length &&
  new Set(p.items.map(i => i.subject)).size === p.items.length);
export type DailyPlan = z.infer<typeof planSchema>;
type PlanItem = DailyPlan['items'][number];

function eligibleLessons(lessons: LessonSummary[], grade: number) {
  return lessons.filter(l => l.grade === grade && l.status === 'published' && l.questionCount === 10);
}
function relevantRecords(lessons: LessonSummary[], records: LearningRecord[], now: Date) {
  const byId = new Map(lessons.map(l => [l.id, l]));
  return records.filter(r => {
    const lesson = byId.get(r.lessonId), time = Date.parse(r.completedAt);
    return lesson && lesson.grade === r.grade && lesson.subject === r.subject &&
      Number.isFinite(time) && time <= now.getTime() && r.total > 0 && r.correct >= 0 && r.correct <= r.total;
  }).sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt) || a.id.localeCompare(b.id));
}

/** One fixed lesson per available subject. Use history before today's local
 * midnight so completing a lesson never replaces today's assignment.
 * Within each subject, two new lessons lead to a weak review (<80%). */
export function buildDailyPlan(lessons: LessonSummary[], records: LearningRecord[], grade: number, now: Date): DailyPlan {
  const eligible = eligibleLessons(lessons, grade);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const history = relevantRecords(eligible, records, now).filter(r => Date.parse(r.completedAt) < midnight);
  const items: PlanItem[] = [];
  for (const subject of subjectOrder) {
    const candidates = eligible.filter(l => l.subject === subject);
    if (!candidates.length) continue;
    const attempts = history.filter(r => r.subject === subject);
    const latest = new Map(attempts.map(r => [r.lessonId, r]));
    const fresh = candidates.filter(l => !latest.has(l.id)).sort((a,b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
    const weak = candidates.filter(l => { const r = latest.get(l.id); return r && r.correct / r.total < .8; }).sort((a,b) => {
      const x = latest.get(a.id)!, y = latest.get(b.id)!;
      return x.correct / x.total - y.correct / y.total || Date.parse(x.completedAt) - Date.parse(y.completedAt) || a.id.localeCompare(b.id);
    });
    let newSinceReview = 0;
    const studied = new Set<string>();
    for (const r of attempts) {
      newSinceReview = studied.has(r.lessonId) ? 0 : newSinceReview + 1;
      studied.add(r.lessonId);
    }
    let chosen: LessonSummary;
    let kind: PlanItem['kind'];
    if (weak.length && (newSinceReview >= 2 || !fresh.length)) {
      chosen = weak[0]; kind = 'weak';
    } else if (fresh.length) {
      chosen = fresh[0]; kind = 'new';
    } else {
      chosen = [...candidates].sort((a,b) => Date.parse(latest.get(a.id)!.completedAt) - Date.parse(latest.get(b.id)!.completedAt) || a.id.localeCompare(b.id))[0];
      kind = 'review';
    }
    items.push({ lessonId: chosen.id, subject, kind });
  }
  return { day: dayKey(now), grade, items };
}

/** Retain each subject's assignment; replace withdrawn lessons and fill missing subjects. */
export function reconcileDailyPlan(cached: unknown, lessons: LessonSummary[], records: LearningRecord[], grade: number, now: Date): DailyPlan {
  const generated = buildDailyPlan(lessons, records, grade, now);
  const parsed = planSchema.safeParse(cached);
  if (!parsed.success || parsed.data.day !== generated.day || parsed.data.grade !== grade) return generated;
  const available = new Map(eligibleLessons(lessons, grade).map(l => [l.id, l]));
  return { ...generated, items: generated.items.map(item =>
    parsed.data.items.find(i => i.subject === item.subject && available.get(i.lessonId)?.subject === item.subject) ?? item) };
}

export function loadDailyPlan(lessons: LessonSummary[], records: LearningRecord[], grade: number, now: Date, memory?: DailyPlan): DailyPlan {
  const key = `${DAILY_PLAN_PREFIX}${grade}`;
  let cached: unknown;
  try { const raw = readStorage(key); cached = raw ? JSON.parse(raw) : undefined; }
  catch { cached = memory; }
  const plan = reconcileDailyPlan(cached, lessons, records, grade, now);
  try {
    const json = JSON.stringify(plan);
    // Avoid storage-event loops between tabs.
    const previous=planSchema.safeParse(cached);
    // PostgreSQL JSONB may reorder object keys. Compare normalized plans,
    // otherwise a cloud round trip can trigger an endless upload loop.
    if (!previous.success || JSON.stringify(previous.data) !== json) {
      try { writeStorage(key, json); } finally { emitOperation({type:'plan',id:crypto.randomUUID(),plan}); }
    }
  } catch { /* Deterministic plan still works without browser storage. */ }
  return plan;
}

export function selectDailyRecommendations(plan: DailyPlan, lessons: LessonSummary[], records: LearningRecord[], now: Date) {
  if (plan.day !== dayKey(now)) return [];
  const eligible = eligibleLessons(lessons, plan.grade);
  const done = new Set(relevantRecords(eligible, records, now).filter(r => dayKey(new Date(r.completedAt)) === plan.day).map(r => r.lessonId));
  return plan.items.flatMap(item => {
    const lesson = eligible.find(l => l.id === item.lessonId && l.subject === item.subject);
    return lesson ? [{ lesson, kind: item.kind, completed: done.has(lesson.id) }] : [];
  });
}

export function clearDailyPlans() {
  for (let grade = 1; grade <= 6; grade++) {
    removeStorage(`${DAILY_PLAN_PREFIX}${grade}`);
    removeStorage(`fun-learning:daily-plan:v1:${grade}`);
  }
}
