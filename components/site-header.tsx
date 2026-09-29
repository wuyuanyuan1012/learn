import Link from 'next/link';
import { Icon } from '@/components/icon';

export function SiteHeader({ admin = false }: { admin?: boolean }) {
  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="brand"><span className="brand-mark"><Icon name="shirt" size={23} /></span><span>沈阳校服<span className="brand-divider"> / </span><span className="brand-light">{admin ? '内容管理' : '款式图册'}</span></span></Link>
    <Link className="header-link" href={admin ? '/' : '/admin'}>{admin ? '查看前台' : '管理后台'}</Link>
  </div></header>;
}
