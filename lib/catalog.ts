import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfig } from '@/lib/config';
import { demoItems } from '@/lib/demo';
import { BUCKET, PAGE_SIZE, type Uniform, type GalleryItem, type Season } from '@/lib/types';
import { z } from 'zod';

export async function withImageUrls(items: Uniform[]): Promise<GalleryItem[]> {
  if (!items.length) return [];
  const supabase = await createClient();
  const paths = [...new Set(items.map(item => item.image_path))];
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error || !data || data.some(item => item.error || !item.signedUrl)) throw new Error('图片暂时无法加载，请稍后重试。');
  const urls = new Map(data.map(item => [item.path, item.signedUrl]));
  return items.map(item => ({ ...item, image_url: urls.get(item.image_path)! }));
}
export async function getGallery(requestedPage: number, season?: Season) {
  if (!supabaseConfig()) {
    const items = demoItems.filter(item => !season || item.season === season);
    const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const page = Math.min(requestedPage, pages);
    return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => ({ ...item, image_url: item.image_path })), total: items.length, pages, page, demo: true };
  }
  const supabase = await createClient();
  let countQuery = supabase.from('uniforms').select('id', { count: 'exact', head: true }).eq('status', 'published');
  if (season) countQuery = countQuery.eq('season', season);
  const { count, error: countError } = await countQuery;
  if (countError) throw new Error('暂时无法读取校服内容。请检查数据库配置后重试。');
  const total = count ?? 0, pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  let query = supabase.from('uniforms').select('*').eq('status', 'published').order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (season) query = query.eq('season', season);
  const { data, error } = await query;
  if (error) throw new Error('暂时无法读取校服内容，请稍后重试。');
  return { items: await withImageUrls(data as Uniform[]), total, page, pages, demo: false };
}
export async function getPublicUniform(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  if (!supabaseConfig()) {
    const item = demoItems.find(item => item.id === id);
    return item ? { ...item, image_url: item.image_path } : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from('uniforms').select('*').eq('id', id).eq('status', 'published').maybeSingle();
  if (error) throw new Error('暂时无法读取这条内容，请稍后重试。');
  return data ? (await withImageUrls([data as Uniform]))[0] : null;
}
