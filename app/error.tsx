'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="container empty-state"><h1>暂时无法加载内容</h1><p>请稍后重试。如果刚配置网站，请确认数据库和存储已初始化。</p><div className="setup-actions"><button className="button" onClick={reset}>重新加载</button><Link href="/" className="button secondary">返回首页</Link></div></main>;
}
