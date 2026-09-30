import { supabaseConfig } from '@/lib/config';
import { requireAdmin } from '@/lib/auth';
import { summarize } from '@/lib/catalog';
import type { Lesson } from '@/lib/types';
import { SetupNotice } from '@/components/setup-notice';
import { AdminDashboard } from '@/components/admin-dashboard';
import { logout } from './actions';
export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  if (!supabaseConfig()) return <SetupNotice />;
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase.from('learning_lessons').select('*').order('updated_at', { ascending: false }).order('id');
  if (error) throw new Error('请先初始化学习题库。');
  return <><AdminDashboard lessons={(data as Lesson[]).map(summarize)} saved={(await searchParams).saved === '1'} /><footer className="admin-account"><span>已登录：{user.email}</span><form action={logout}><button className="text-button">退出登录</button></form></footer></>;
}
