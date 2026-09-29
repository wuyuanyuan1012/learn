'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAdmin } from '@/lib/auth';
import { supabaseConfig } from '@/lib/config';
import { BUCKET } from '@/lib/types';
import { uniformSchema } from '@/lib/validation';
import { demoAssets, demoItems } from '@/lib/demo';

type Result = { ok: boolean; error?: string; id?: string };
type Client = Awaited<ReturnType<typeof createClient>>;

export async function login(_previous: { error?: string }, form: FormData): Promise<{ error?: string }> {
  if (!supabaseConfig()) return { error: '请先完成内容库配置。' };
  const parsed = z.object({ email: z.email(), password: z.string().min(1).max(256) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: '请输入有效的邮箱和密码。' };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: '登录失败，请检查邮箱和密码；请求过于频繁时请稍后再试。' };
  const admin = await getAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: '此账号没有管理权限，请先将账号加入管理员名单。' };
  }
  redirect('/admin');
}
export async function logout() {
  if (supabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect('/admin/login');
}
async function verifyUpload(supabase: Client, path: string, userId: string) {
  if (!path.startsWith(`${userId}/`)) return false;
  const [folder, file] = path.split('/');
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, { search: file, limit: 100 });
  return !error && !!data?.some(item => item.name === file && item.id);
}
async function removeUnusedImage(supabase: Client, path: string) {
  // Several legacy styles share one source image. Never remove it while in use.
  const { count, error } = await supabase.from('uniforms').select('id', { count: 'exact', head: true }).eq('image_path', path);
  if (!error && count === 0) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
    if (storageError) console.error('Unused image cleanup failed:', storageError.message);
  }
}
function refresh(id?: string) {
  revalidatePath('/'); revalidatePath('/admin');
  if (id) revalidatePath(`/uniforms/${id}`);
}
export async function saveUniform(input: unknown): Promise<Result> {
  if (!supabaseConfig()) return { ok: false, error: '内容库尚未配置。' };
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: '登录已过期或无管理权限，请重新登录。' };
  const parsed = uniformSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || '请检查表单内容。' };
  const { supabase, user } = admin;
  const { id, ...values } = parsed.data;
  let previous: { image_path: string; image_crop: unknown; image_width: number; image_height: number } | null = null;
  if (id) {
    const { data, error } = await supabase.from('uniforms').select('image_path,image_crop,image_width,image_height').eq('id', id).maybeSingle();
    if (error || !data) return { ok: false, error: '这条内容已不存在，请刷新列表。' };
    previous = data;
  }
  const changedImage = previous?.image_path !== values.image_path;
  if (changedImage && !(await verifyUpload(supabase, values.image_path, user.id))) return { ok: false, error: '没有找到上传的图片，请重新选择并上传。' };
  const record = {
    ...values,
    image_width: changedImage ? values.image_width : previous!.image_width,
    image_height: changedImage ? values.image_height : previous!.image_height,
    image_crop: changedImage ? null : previous!.image_crop,
  };
  const mutation = id ? supabase.from('uniforms').update(record).eq('id', id) : supabase.from('uniforms').insert(record);
  const { data, error } = await mutation.select('id').single();
  if (error || !data) return { ok: false, error: '保存失败，请稍后重试。请确认数据库已初始化且账号有管理权限。' };
  if (previous && changedImage) await removeUnusedImage(supabase, previous.image_path);
  refresh(data.id);
  return { ok: true, id: data.id };
}
export async function deleteUniform(id: string): Promise<Result> {
  if (!supabaseConfig()) return { ok: false, error: '内容库尚未配置。' };
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: '登录已过期或无管理权限，请重新登录。' };
  if (!z.uuid().safeParse(id).success) return { ok: false, error: '无效的内容编号。' };
  const { data, error } = await admin.supabase.from('uniforms').delete().eq('id', id).select('image_path').maybeSingle();
  if (error) return { ok: false, error: '删除失败，请稍后重试。' };
  if (data) await removeUnusedImage(admin.supabase, data.image_path);
  refresh(id);
  return { ok: true };
}
export async function importCatalog(paths: unknown): Promise<Result> {
  if (!supabaseConfig()) return { ok: false, error: '内容库尚未配置。' };
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: '登录已过期或无管理权限，请重新登录。' };
  const parsed = z.record(z.string(), uniformSchema.shape.image_path).safeParse(paths);
  if (!parsed.success || Object.keys(parsed.data).sort().join() !== Object.keys(demoAssets).sort().join()) return { ok: false, error: '导入图片不完整，请重试。' };
  const { count, error: countError } = await admin.supabase.from('uniforms').select('id', { count: 'exact', head: true });
  if (countError || count !== 0) return { ok: false, error: '只有空的内容库可以导入初始款式。请刷新页面。' };
  const valid = await Promise.all(Object.values(parsed.data).map(path => verifyUpload(admin.supabase, path, admin.user.id)));
  if (valid.some(value => !value)) return { ok: false, error: '部分图片未上传成功，请重新导入。' };
  const items = demoItems.map(({ asset_key, ...item }) => ({ ...item, image_path: parsed.data[asset_key] }));
  const { error } = await admin.supabase.from('uniforms').insert(items);
  if (error) return { ok: false, error: '导入失败，请检查数据库设置后重试。' };
  refresh();
  return { ok: true };
}
