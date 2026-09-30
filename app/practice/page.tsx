import { getLessons } from '@/lib/catalog';
import { SiteHeader } from '@/components/site-header';
import { LearningHome } from '@/components/learning-home';
export const metadata = { title: '趣味练习' };
export const dynamic = 'force-dynamic';
export default async function PracticePage() { return <><SiteHeader /><LearningHome {...await getLessons()} library /></>; }
