'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './icon';
const links: { href: string; title: string; icon: IconName }[] = [{ href: '/', title: '学习首页', icon: 'home' }, { href: '/practice', title: '趣味练习', icon: 'book' }, { href: '/progress', title: '我的成长', icon: 'chart' }];
export function SiteHeader({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  return <><header className="site-header"><div className="header-inner">
    <Link href={admin ? '/admin' : '/'} className="brand"><span className="brand-mark"><Icon name="book" size={23} /></span><span>趣味学习</span>{admin && <span className="admin-label">管理后台</span>}</Link>
    {!admin && <nav className="desktop-nav" aria-label="主导航">{links.map(l => <Link href={l.href} key={l.href} className={pathname === l.href ? 'active' : ''} aria-current={pathname === l.href ? 'page' : undefined}>{l.title}</Link>)}</nav>}
    <Link className="header-link" href={admin ? '/' : '/admin'}>{admin ? '查看学习前台' : '管理后台'}<Icon name="arrow" size={16} /></Link>
  </div></header>{!admin && <nav className="mobile-nav" aria-label="主导航">{links.map(l => <Link href={l.href} key={l.href} className={pathname === l.href ? 'active' : ''} aria-current={pathname === l.href ? 'page' : undefined}><Icon name={l.icon} size={22} /><span>{l.title}</span></Link>)}</nav>}</>;
}
