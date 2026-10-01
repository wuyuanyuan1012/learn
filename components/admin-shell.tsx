'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/admin/actions';
import { Icon } from './icon';
import { SiteHeader } from './site-header';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') {
    return <><SiteHeader admin /><main className="container admin-main">{children}</main></>;
  }

  const members = pathname === '/admin/members' || pathname.startsWith('/admin/members/');
  const moduleName = members ? '会员管理' : '关卡管理';
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/admin" className="brand admin-brand"><span className="brand-mark"><Icon name="book" size={23} /></span><span>趣味学习<small>管理后台</small></span></Link>
      <p className="admin-nav-label">管理模块</p>
      <nav className="admin-module-nav" aria-label="后台模块导航">
        <Link href="/admin" aria-current={!members ? 'page' : undefined}><Icon name="grid" /><span>关卡管理</span><Icon name="right" size={16} /></Link>
        <Link href="/admin/members" aria-current={members ? 'page' : undefined}><Icon name="users" /><span>会员管理</span><Icon name="right" size={16} /></Link>
      </nav>
      <p className="admin-sidebar-note">用好内容，陪伴每次成长。</p>
    </aside>
    <div className="admin-workspace">
      <header className="admin-workspace-header">
        <p className="admin-breadcrumb"><span>管理后台</span><Icon name="right" size={14} /><strong>{moduleName}</strong></p>
        <div className="admin-header-actions"><Link href="/" className="text-link">学习前台<Icon name="arrow" size={16} /></Link><form action={logout}><button className="text-button">退出登录</button></form></div>
      </header>
      <main className="admin-main admin-workspace-main">{children}</main>
    </div>
  </div>;
}
