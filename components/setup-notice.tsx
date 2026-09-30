import Link from 'next/link';
import { Icon } from './icon';
export function SetupNotice() {
  return <section className="setup-card panel"><span className="section-icon"><Icon name="book" size={26} /></span><p className="eyebrow">欢迎使用趣味学习</p><h1>连接你的学习题库</h1><p className="lede">前台已可体验示例关卡。连接 Supabase 后，即可登录后台管理题目与发布内容。</p><ol className="setup-steps"><li><strong>配置数据库</strong><p>在 Supabase SQL Editor 执行 <code>supabase/schema.sql</code>，创建学习题库和访问权限。</p></li><li><strong>授权管理员</strong><p>在 Authentication 中创建邮箱密码账号，再按 SQL 文件说明加入管理员名单。</p></li><li><strong>填写环境变量</strong><p>在 <code>.env.local</code> 填写公开的项目 URL 和 Publishable Key。部署时也需配置，操作见 README。</p></li></ol><Link href="/" className="button">先体验学习前台<Icon name="arrow" size={17} /></Link></section>;
}
