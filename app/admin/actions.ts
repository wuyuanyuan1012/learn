'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAdmin } from '@/lib/auth';
import { supabaseConfig } from '@/lib/config';
import { lessonSchema } from '@/lib/validation';
import { seedLessons } from '@/lib/seed';
type Result = { ok: boolean; error?: string; id?: string };
export async function login(_previous: { error?: string }, form: FormData): Promise<{ error?: string }> {
  if (!supabaseConfig()) return { error: '请先完成题库配置。' };
  const parsed = z.object({ email: z.email(), password: z.string().min(1).max(256) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: '请输入有效的邮箱和密码。' };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: '登录失败，请检查邮箱和密码；请求过于频繁时请稍后再试。' };
  if (!(await getAdmin())) {
    await supabase.auth.signOut();
    return { error: '此账号没有管理权限，请联系项目所有者授权。' };
  }
  redirect('/admin');
}
export async function logout() {
  if (supabaseConfig()) { const supabase = await createClient(); await supabase.auth.signOut(); }
  redirect('/admin/login');
}
function refresh(id?: string) {
  revalidatePath('/'); revalidatePath('/practice'); revalidatePath('/progress'); revalidatePath('/admin');
  if (id) { revalidatePath(`/learn/${id}`); revalidatePath(`/admin/${id}/edit`); }
}
export async function saveLesson(input: unknown, expectedVersion?: string): Promise<Result> {
  if (!supabaseConfig()) return { ok: false, error: '题库尚未配置。' };
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: '登录已过期或无管理权限，请重新登录。' };
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || '请检查表单内容。' };
  const { id, ...record } = parsed.data;
  if (id && !z.iso.datetime({ offset: true }).safeParse(expectedVersion).success) return { ok: false, error: '缺少版本信息，请刷新后重试。' };
  const mutation = id ? admin.supabase.from('learning_lessons').update(record).eq('id', id).eq('updated_at', expectedVersion!) : admin.supabase.from('learning_lessons').insert(record);
  const { data, error } = await mutation.select('id').maybeSingle();
  if (error) return { ok: false, error: '保存失败，请检查题库配置后重试。' };
  if (!data) return { ok: false, error: '此关卡已被修改或删除，请保留你的内容并刷新页面后重试。' };
  refresh(data.id); return { ok: true, id: data.id };
}
export async function deleteLesson(id: string): Promise<Result> {
  if (!supabaseConfig()) return { ok: false, error: '题库尚未配置。' };
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: '登录已过期或无管理权限，请重新登录。' };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: '无效的关卡编号。' };
  const { error } = await admin.supabase.from('learning_lessons').delete().eq('id', id);
  if (error) return { ok: false, error: '删除失败，请稍后重试。' };
  refresh(id); return { ok: true };
}
export async function importLessons(): Promise<Result> {
  if (!supabaseConfig()) return { ok: false, error: '题库尚未配置。' };
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: '登录已过期或无管理权限，请重新登录。' };
  // A single atomic insert; repeated imports never overwrite edited lessons.
  const { error } = await admin.supabase.from('learning_lessons').upsert(seedLessons.map(l => lessonSchema.parse(l)), { onConflict: 'id', ignoreDuplicates: true });
  if (error) return { ok: false, error: '导入失败，请检查题库初始化后重试。' };
  refresh(); return { ok: true };
}
