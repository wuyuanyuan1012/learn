import Link from 'next/link';
import { getGallery } from '@/lib/catalog';
import { pageNumber, seasonFilter } from '@/lib/validation';
import { seasonNames } from '@/lib/types';
import { SiteHeader } from '@/components/site-header';
import { Media } from '@/components/media';
import { Pagination } from '@/components/pagination';
import { Icon } from '@/components/icon';

export const dynamic = 'force-dynamic';
export default async function GalleryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const season = seasonFilter(params.season);
  const gallery = await getGallery(pageNumber(params.page), season);
  return <><SiteHeader /><main className="container gallery-main">
    <section className="gallery-intro"><div><p className="eyebrow">校园日常 / UNIFORM COLLECTION</p><h1>柏童服饰<span className="title-dot">.</span></h1><p className="lede">看看不同款式，找到熟悉的校园色彩。</p></div><div className="collection-count"><strong>{gallery.total.toString().padStart(2, '0')}</strong><span>{season ? seasonNames[season] : '全部'}款式</span></div></section>
    {gallery.demo && <div className="demo-banner"><span>当前展示原有 12 款校服；连接内容库后可在后台管理。</span><Link href="/admin">开始设置</Link></div>}
    <div className="gallery-controls"><nav className="season-tabs" aria-label="按季节筛选"><Link className={!season ? 'selected' : ''} href="/" aria-current={!season ? 'page' : undefined}>全部款式</Link>{Object.entries(seasonNames).map(([key, name]) => <Link href={`/?season=${key}`} className={season === key ? 'selected' : ''} aria-current={season === key ? 'page' : undefined} key={key}>{name}</Link>)}</nav><span className="page-summary">{gallery.total ? `第 ${gallery.page} / ${gallery.pages} 页` : '暂无内容'}</span></div>
    {gallery.items.length ? <div className="gallery-grid">{gallery.items.map((item, i) => <Link href={`/uniforms/${item.id}`} className="gallery-card" key={item.id}>
      <div className="card-image"><span className={`season-tag ${item.season}`}>{seasonNames[item.season]}</span><Media item={item} eager={i < 2} /></div>
      <div className="card-copy"><div className="card-kicker"><span>款式介绍</span><Icon name="right" size={17} /></div><h2>{item.title}</h2><p>{item.description}</p></div>
    </Link>)}</div> : <div className="empty-state"><Icon name="image" size={38} /><h2>{season ? '这个季节的款式还在整理中' : '还没有发布的校服款式'}</h2><p>{season ? '先看看其他季节的图片与介绍。' : '管理员发布内容后，会在这里展示。'}</p><Link className="button secondary" href={season ? '/' : '/admin'}>{season ? '查看全部款式' : '进入管理后台'}</Link></div>}
    <Pagination page={gallery.page} pages={gallery.pages} params={season ? { season } : {}} />
    <footer className="site-footer"><span>柏童服饰 · 款式图册</span><span>具体款式以学校最新公示为准</span></footer>
  </main></>;
}
