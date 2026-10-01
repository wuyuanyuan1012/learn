import { requireMember } from '@/lib/members/server';
import { notFound } from 'next/navigation';
import { getLesson } from '@/lib/catalog';
import { Quiz } from '@/components/quiz';
export const dynamic = 'force-dynamic';
export const metadata = { title: '知识小挑战' };
export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMember();
  const lesson = await getLesson((await params).id);
  if (!lesson) notFound();
  return <Quiz lesson={lesson} key={`${lesson.id}:${lesson.updated_at}`} />;
}
