import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { supabaseConfig } from '@/lib/config';
import { requireAdmin } from '@/lib/auth';
import { withImageUrls } from '@/lib/catalog';
import type { Uniform } from '@/lib/types';
import { SetupNotice } from '@/components/setup-notice';
import { UniformForm } from '@/components/uniform-form';
import { Icon } from '@/components/icon';
export default async function EditUniformPage({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfig()) return <SetupNotice />;
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await supabase.from('uniforms').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error('无法读取内容，请稍后重试。');
  if (!data) notFound();
  const item = (await withImageUrls([data as Uniform]))[0];
  return <><Link className="back-link" href="/admin"><Icon name="left" size={17} />返回内容列表</Link><div className="admin-top"><div><h1>编辑款式</h1><p>修改图片、介绍或发布状态。</p></div>{item.status === 'published' && <Link className="button secondary small" href={`/uniforms/${item.id}`}>查看前台</Link>}</div><UniformForm initial={item} /></>;
}
