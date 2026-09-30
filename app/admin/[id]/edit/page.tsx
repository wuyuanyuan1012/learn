import { notFound } from 'next/navigation';
import { z } from 'zod';
import { supabaseConfig } from '@/lib/config';
import { requireAdmin } from '@/lib/auth';
import type { Lesson } from '@/lib/types';
import { SetupNotice } from '@/components/setup-notice';
import { LessonForm } from '@/components/lesson-form';
export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfig()) return <SetupNotice />;
  const { supabase } = await requireAdmin();
  const { id } = await params; if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await supabase.from('learning_lessons').select('*').eq('id',id).maybeSingle();
  if (error) throw new Error('无法读取关卡，请稍后重试。');
  if (!data) notFound();
  return <LessonForm initial={data as Lesson} />;
}
