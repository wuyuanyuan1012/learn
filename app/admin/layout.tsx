import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
export const metadata: Metadata = { title: '学习管理后台', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <><SiteHeader admin /><main className="container admin-main">{children}</main></>;
}
