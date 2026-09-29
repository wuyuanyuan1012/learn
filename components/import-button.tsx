'use client';
import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { demoAssets } from '@/lib/demo';
import { BUCKET } from '@/lib/types';
import { importCatalog } from '@/app/admin/actions';

export function ImportButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function run() {
    if (busy) return;
    setBusy(true); setMessage('正在准备导入…');
    const supabase = createClient();
    const uploaded: string[] = [];
    let mayBeReferenced = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('登录已过期，请重新登录。');
      const paths: Record<string, string> = {};
      const assets = Object.entries(demoAssets);
      for (const [i, [key, asset]] of assets.entries()) {
        setMessage(`正在上传图片 ${i + 1} / ${assets.length}…`);
        const response = await fetch(asset.path);
        if (!response.ok) throw new Error('无法读取初始图片，请确认项目图片文件完整。');
        const blob = await response.blob();
        const extension = asset.path.endsWith('.jpg') ? 'jpg' : 'png';
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: extension === 'jpg' ? 'image/jpeg' : 'image/png', upsert: false });
        if (error) throw new Error('图片上传失败，请确认存储已初始化且账号有管理权限。');
        uploaded.push(path); paths[key] = path;
      }
      setMessage('正在保存 12 条款式介绍…');
      mayBeReferenced = true;
      const result = await importCatalog(paths);
      if (!result.ok) { mayBeReferenced = false; throw new Error(result.error); }
      router.push('/admin?notice=imported'); router.refresh();
    } catch (error) {
      // Only remove our uploads if the records were not committed.
      if (!mayBeReferenced && uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
      setMessage(error instanceof Error ? error.message : '导入失败，请稍后重试。');
    } finally { setBusy(false); }
  }
  return <div className="import-box"><div><h3>从现有 12 款校服开始</h3><p>将原有图片和介绍导入内容库。导入后即可编辑，也会在前台展示。</p>{message && <p className="form-progress" role="status">{message}</p>}</div><button className="button secondary" onClick={() => startTransition(run)} disabled={busy}>{busy ? '正在导入…' : '导入现有款式'}</button></div>;
}
