import { requireMember } from '@/lib/members/server';
import { getLessons } from '@/lib/catalog';
import { SiteHeader } from '@/components/site-header';
import { LearningHome } from '@/components/learning-home';
export const metadata = { title: '今日挑战' };
export const dynamic = 'force-dynamic';
export default async function HomePage() {
  await requireMember();
  const data = await getLessons();
  return <><SiteHeader /><LearningHome {...data} /></>;
}
