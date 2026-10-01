import { supabaseConfig } from '@/lib/config';
import { requireAdmin } from '@/lib/auth';
import { memberQuery } from '@/lib/members/database';
import { withClassification } from '@/lib/classification';
import type { LessonSummary } from '@/lib/types';
import { SetupNotice } from '@/components/setup-notice';
import { AdminDashboard } from '@/components/admin-dashboard';
export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  if (!supabaseConfig()) return <SetupNotice />;
  const { user } = await requireAdmin();
  const {rows}=await memberQuery<LessonSummary>(`select id,title,description,subject,grade,topic,minutes,status,category,tags,created_at::text,updated_at::text,jsonb_array_length(questions) as "questionCount" from learning_lessons order by learning_lessons.updated_at desc,learning_lessons.id`);
  return <><AdminDashboard lessons={rows.map(withClassification)} saved={(await searchParams).saved === '1'} /><footer className="admin-account"><span>已登录：{user.email}</span></footer></>;
}
