import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: '趣味学习 · 每天一点新发现', template: '%s · 趣味学习' },
  description: '适合小学生的趣味学习站。数学、语文、英语和科学，用轻松的小挑战学会新知识。',
  icons: { icon: '/icon.svg' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f7f9f7' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
