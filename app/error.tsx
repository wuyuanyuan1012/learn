'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="container empty-state"><h1>知识暂时还没送达</h1><p>请稍后重试。管理员可检查学习题库的连接与初始化状态。</p><div className="confirm-actions"><button className="button" onClick={reset}>重新加载</button><Link href="/" className="button secondary">返回首页</Link></div></main>;
}
