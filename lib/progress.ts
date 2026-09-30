import { z } from 'zod';
import type { LearningRecord, Lesson } from './types';
export const RECORDS_KEY = 'fun-learning:records:v1';
export const GRADE_KEY = 'fun-learning:grade:v1';
const recordSchema = z.object({
  id: z.uuid(), lessonId: z.uuid(), title: z.string().max(60), subject: z.enum(['math','chinese','english','science']), grade: z.number().int().min(1).max(6),
  correct: z.number().int().min(0), total: z.number().int().min(1).max(20), seconds: z.number().int().min(0).max(86400),
  completedAt: z.iso.datetime(), wrongIds: z.array(z.uuid()).max(20),
}).refine(r => r.correct <= r.total && r.wrongIds.length === r.total - r.correct);
export function readRecords(): LearningRecord[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    if (!Array.isArray(data)) return [];
    return data.flatMap(item => { const p = recordSchema.safeParse(item); return p.success ? [p.data] : []; }).slice(-500);
  } catch { return []; }
}
export function saveRecord(record: LearningRecord): boolean {
  try {
    const parsed = recordSchema.parse(record);
    const records = readRecords().filter(r => r.id !== parsed.id);
    localStorage.setItem(RECORDS_KEY, JSON.stringify([...records, parsed].slice(-500)));
    return true;
  } catch { return false; }
}
export function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function weekDays(now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => { const day = new Date(monday); day.setDate(day.getDate() + i); return dayKey(day); });
}
export type Session = { id: string; version: string; index: number; answers: number[]; seconds: number };
export function sessionKey(id: string) { return `fun-learning:session:${id}`; }
export function lessonVersion(lesson: Lesson) { return JSON.stringify([lesson.updated_at, lesson.questions]); }
export function readSession(lesson: Lesson): Session | null {
  try {
    const result = z.object({ id: z.uuid(), version: z.string(), index: z.number().int().min(0), answers: z.array(z.number().int().min(0).max(3)), seconds: z.number().int().min(0).max(86400) }).safeParse(JSON.parse(localStorage.getItem(sessionKey(lesson.id)) || 'null'));
    if (!result.success) return null;
    const s = result.data;
    if (s.version !== lessonVersion(lesson) || s.index >= lesson.questions.length || s.answers.length < s.index || s.answers.length > s.index + 1) return null;
    return s;
  } catch { return null; }
}
