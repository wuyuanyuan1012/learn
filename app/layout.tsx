import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '柏童服饰', template: '%s · 柏童服饰' },
  description: '柏童服饰，浏览沈阳中小学校服图片与款式介绍，了解春秋装、冬装与更多校园穿搭。',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
