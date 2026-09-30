import Link from 'next/link';
import { Icon } from '@/components/icon';
export default function NotFound() { return <main className="container empty-state"><span className="section-icon"><Icon name="book" size={30} /></span><h1>这个小挑战暂时不在这里</h1><p>它可能还在准备中，或已经下架。先看看其他知识吧。</p><Link href="/" className="button">回到学习首页</Link></main>; }
