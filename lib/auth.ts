import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function getAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: admin } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) return null;
  return { supabase, user };
}
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}
