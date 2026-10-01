import { requireMember } from '@/lib/members/server';
import { getLessons } from '@/lib/catalog';
import { SiteHeader } from '@/components/site-header';
import { LearningHome } from '@/components/learning-home';
export const metadata = { title: '全部练习' };
export const dynamic = 'force-dynamic';
export default async function PracticePage() { await requireMember(); return <><SiteHeader /><LearningHome {...await getLessons()} library /></>; }
