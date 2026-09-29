import Link from 'next/link';
export default function NotFound() { return <main className="container empty-state"><h1>没有找到这条内容</h1><p>它可能尚未发布，或已被移除。</p><Link href="/" className="button">返回款式图册</Link></main>; }
