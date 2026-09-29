import Link from 'next/link';
import { supabaseConfig } from '@/lib/config';
import { requireAdmin } from '@/lib/auth';
import { SetupNotice } from '@/components/setup-notice';
import { UniformForm } from '@/components/uniform-form';
import { Icon } from '@/components/icon';
export default async function NewUniformPage() {
  if (!supabaseConfig()) return <SetupNotice />;
  await requireAdmin();
  return <><Link className="back-link" href="/admin"><Icon name="left" size={17} />返回内容列表</Link><div className="admin-top"><div><h1>新增款式</h1><p>上传图片，写下这款校服的介绍。</p></div></div><UniformForm /></>;
}
