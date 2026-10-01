import { requireMember } from '@/lib/members/server';
import { SiteHeader } from '@/components/site-header';
import { LearningProgress } from '@/components/learning-progress';
import { getLessons } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export const metadata = { title: '我的成长' };
export default async function ProgressPage() {
  await requireMember();
  const { lessons } = await getLessons();
  return <><SiteHeader /><LearningProgress availableIds={lessons.map(l => l.id)} /></>;
}
