import Link from 'next/link';
import { Icon } from '@/components/icon';

export function SetupNotice() {
  return <section className="setup-card">
    <span className="section-icon"><Icon name="lock" size={25} /></span><p className="eyebrow">首次使用</p><h1>连接你的内容库</h1>
    <p className="lede">前台图册已可预览。完成以下配置后，就能登录后台上传图片、编辑介绍和发布内容。</p>
    <ol className="setup-steps">
      <li><strong>创建 Supabase 项目</strong><p>在 Supabase 新建项目，复制项目 URL 和 Publishable Key。</p></li>
      <li><strong>初始化数据库和图片存储</strong><p>在 SQL Editor 执行项目中的 <code>supabase/schema.sql</code>。</p></li>
      <li><strong>创建管理员账号</strong><p>在 Authentication → Users 创建邮箱密码账号，再按 SQL 文件末尾说明将账号加入管理员名单。</p></li>
      <li><strong>配置环境变量并重新部署</strong><p>将项目 URL 和密钥填入 <code>.env.local</code>；Vercel 中也需设置这两项环境变量。详细步骤见项目 README。</p></li>
    </ol>
    <div className="setup-actions"><a className="button" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">打开 Supabase</a><Link className="button secondary" href="/">预览前台图册</Link></div>
  </section>;
}
