import 'server-only';
import { z } from 'zod';
import { memberQuery } from '@/lib/members/database';
import { supabaseConfig } from '@/lib/config';
import { expandedSeedLessons as seedLessons } from '@/content/ten-question-lessons';
import type { Lesson, LessonSummary } from '@/lib/types';
import { withClassification } from '@/lib/classification';

export function summarize(lesson: Lesson): LessonSummary {
  const { questions, ...rest } = lesson;
  return { ...withClassification(rest), questionCount: questions.length };
}
export async function getLessons(ids?:string[]) {
  if (!supabaseConfig()) return { lessons: seedLessons.map(summarize), demo: true };
  const {rows}=await memberQuery<LessonSummary>(`select id,title,description,subject,grade,topic,minutes,status,category,tags,created_at::text,updated_at::text,jsonb_array_length(questions) as "questionCount" from learning_lessons where status='published' and ($1::uuid[] is null or id=any($1::uuid[])) order by learning_lessons.created_at,learning_lessons.id`,[ids??null]);
  return {lessons:rows.map(withClassification),demo:false};
}
export async function getLesson(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  if (!supabaseConfig()) return seedLessons.find(l => l.id === id) ?? null;
  const {rows}=await memberQuery<Lesson>("select *,created_at::text,updated_at::text from learning_lessons where id=$1 and status='published'",[id]);
  return rows[0]??null;
}
