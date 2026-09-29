import Link from 'next/link';
import { supabaseConfig } from '@/lib/config';
import { requireAdmin } from '@/lib/auth';
import { withImageUrls } from '@/lib/catalog';
import { ADMIN_PAGE_SIZE, seasonNames, type Uniform } from '@/lib/types';
import { pageNumber } from '@/lib/validation';
import { SetupNotice } from '@/components/setup-notice';
import { Media } from '@/components/media';
import { Icon } from '@/components/icon';
import { Pagination } from '@/components/pagination';
import { ImportButton } from '@/components/import-button';
import { logout } from './actions';

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!supabaseConfig()) return <SetupNotice />;
  const { supabase, user } = await requireAdmin();
  const params = await searchParams;
  const [all, published] = await Promise.all([
    supabase.from('uniforms').select('id', { count: 'exact', head: true }),
    supabase.from('uniforms').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ]);
  if (all.error || published.error) throw new Error('无法读取内容，请检查数据库初始化。');
  const total = all.count ?? 0, publishedCount = published.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)), page = Math.min(pageNumber(params.page), pages);
  const { data, error } = await supabase.from('uniforms').select('*').order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1);
  if (error) throw new Error('无法读取内容，请稍后重试。');
  const items = await withImageUrls(data as Uniform[]);
  const notices: Record<string, string> = { saved: '内容已保存。已发布的款式可在前台查看。', deleted: '内容已删除。', imported: '12 条校服款式已成功导入并发布。' };
  const notice = typeof params.notice === 'string' ? notices[params.notice] : null;
  return <>
    <div className="admin-top"><div><p className="eyebrow">管理后台</p><h1>校服内容</h1><p>管理图片与介绍，让每一款都清楚呈现。</p></div><div className="admin-actions"><Link className="button" href="/admin/new"><Icon name="plus" size={18} />新增款式</Link></div></div>
    {notice && <div className="alert" role="status">{notice}</div>}
    <div className="stats-row"><div className="stat-box"><strong>{total}</strong><span>全部内容</span></div><div className="stat-box"><strong>{publishedCount}</strong><span>已发布</span></div><div className="stat-box"><strong>{total - publishedCount}</strong><span>草稿</span></div></div>
    {items.length ? <div className="admin-list">{items.map(item => <article className="admin-row" key={item.id}><div className="admin-thumb"><Media item={item} /></div><div className="admin-row-copy"><h2>{item.title}</h2><div className="admin-row-meta"><span className={`status ${item.status}`}>{item.status === 'published' ? '已发布' : '草稿'}</span><span>{seasonNames[item.season]}</span><span>{new Date(item.updated_at).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span></div></div><Link className="button secondary small" href={`/admin/${item.id}/edit`} aria-label={`编辑 ${item.title}`}><Icon name="edit" size={15} />编辑</Link></article>)}</div> : <div className="empty-state"><Icon name="image" size={36} /><h2>从第一款校服开始</h2><p>上传一张图片，写下介绍，即可发布到前台。</p><Link className="button" href="/admin/new">新增款式</Link></div>}
    <Pagination page={page} pages={pages} base="/admin" />
    {total === 0 && <ImportButton />}
    <div className="admin-account"><span>当前账号：{user.email}</span><form action={logout}><button className="button subtle small">退出登录</button></form></div>
  </>;
}
