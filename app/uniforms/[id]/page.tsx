import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicUniform } from '@/lib/catalog';
import { seasonNames } from '@/lib/types';
import { SiteHeader } from '@/components/site-header';
import { ImageViewer } from '@/components/image-viewer';
import { Icon } from '@/components/icon';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const item = await getPublicUniform((await params).id);
  return { title: item?.title ?? '款式未找到', description: item?.description.slice(0, 160) };
}
export default async function UniformPage({ params }: { params: Promise<{ id: string }> }) {
  const item = await getPublicUniform((await params).id);
  if (!item) notFound();
  return <><SiteHeader /><main className="container detail-main"><Link className="back-link" href="/"><Icon name="left" size={17} />返回款式图册</Link><div className="detail-layout"><ImageViewer item={item} /><article className="detail-copy"><span className={`season-tag inline ${item.season}`}>{seasonNames[item.season]}</span><h1>{item.title}</h1><div className="detail-rule" /><h2>款式介绍</h2><p className="description-text">{item.description}</p><p className="detail-note">款式与实际选用情况，以学校最新公示为准。</p></article></div></main></>;
}
