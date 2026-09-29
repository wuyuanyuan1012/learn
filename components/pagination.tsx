import Link from 'next/link';
import { Icon } from '@/components/icon';

export function Pagination({ page, pages, base = '/', params = {} }: { page: number; pages: number; base?: string; params?: Record<string, string> }) {
  if (pages <= 1) return null;
  const href = (n: number) => `${base}?${new URLSearchParams({ ...params, page: String(n) })}`;
  const visible = [...new Set([1, page - 1, page, page + 1, pages])].filter(n => n > 0 && n <= pages).sort((a, b) => a - b);
  return <nav className="pagination" aria-label="分页">
    {page > 1 ? <Link className="page-arrow" href={href(page - 1)} aria-label="上一页"><Icon name="left" /></Link> : <span className="page-arrow disabled" aria-disabled="true"><Icon name="left" /></span>}
    {visible.map((n, i) => <span className="page-slot" key={n}>{i > 0 && n - visible[i - 1] > 1 && <span className="ellipsis">…</span>}<Link className={`page-number ${n === page ? 'active' : ''}`} aria-label={`第 ${n} 页`} aria-current={n === page ? 'page' : undefined} href={href(n)}>{n}</Link></span>)}
    {page < pages ? <Link className="page-arrow" href={href(page + 1)} aria-label="下一页"><Icon name="right" /></Link> : <span className="page-arrow disabled" aria-disabled="true"><Icon name="right" /></span>}
  </nav>;
}
