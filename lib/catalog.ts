import 'server-only';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfig } from '@/lib/config';
import { seedLessons } from '@/lib/seed';
import type { Lesson, LessonSummary } from '@/lib/types';

export function summarize(lesson: Lesson): LessonSummary {
  const { questions, ...rest } = lesson;
  return { ...rest, questionCount: questions.length };
}
export async function getLessons() {
  if (!supabaseConfig()) return { lessons: seedLessons.map(summarize), demo: true };
  const supabase = await createClient();
  const { data, error } = await supabase.from('learning_lessons').select('*').eq('status', 'published').order('created_at').order('id');
  if (error) throw new Error('题库暂时无法加载，请检查学习数据库是否已初始化。');
  return { lessons: (data as Lesson[]).map(summarize), demo: false };
}
export async function getLesson(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  if (!supabaseConfig()) return seedLessons.find(l => l.id === id) ?? null;
  const supabase = await createClient();
  const { data, error } = await supabase.from('learning_lessons').select('*').eq('id', id).eq('status', 'published').maybeSingle();
  if (error) throw new Error('关卡暂时无法加载，请稍后重试。');
  return data as Lesson | null;
}
