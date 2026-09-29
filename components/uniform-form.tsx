'use client';
import { startTransition, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { BUCKET, seasonNames, type GalleryItem, type Season } from '@/lib/types';
import { mimeExtensions, validateImage, uniformSchema } from '@/lib/validation';
import { saveUniform, deleteUniform } from '@/app/admin/actions';
import { Media } from '@/components/media';
import { Icon } from '@/components/icon';

export function UniformForm({ initial }: { initial?: GalleryItem }) {
  const router = useRouter(), deleteDialog = useRef<HTMLDialogElement>(null), fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState('');
  const [title, setTitle] = useState(initial?.title ?? ''), [description, setDescription] = useState(initial?.description ?? '');
  const [season, setSeason] = useState<Season>(initial?.season ?? 'autumn');
  const [status, setStatus] = useState<'draft' | 'published'>(initial?.status ?? 'draft');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [progress, setProgress] = useState('');
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function chooseFile(next?: File) {
    if (!next) return;
    const issue = validateImage(next);
    if (issue) { setError(issue); if (fileInput.current) fileInput.current.value = ''; return; }
    setError(''); setFile(next);
  }
  async function submit() {
    if (busy) return;
    setError('');
    if (!file && !initial) { setError('请先选择一张校服图片。'); fileInput.current?.focus(); return; }
    setBusy(true); setProgress('正在保存…');
    const supabase = createClient();
    let uploadedPath: string | null = null, mayBeReferenced = false;
    try {
      let path = initial?.image_path ?? '', width = initial?.image_width ?? 0, height = initial?.image_height ?? 0;
      if (file) {
        const issue = validateImage(file); if (issue) throw new Error(issue);
        const url = URL.createObjectURL(file), image = new Image();
        try { image.src = url; await image.decode(); width = image.naturalWidth; height = image.naturalHeight; }
        catch { throw new Error('无法读取这张图片，请选择有效的 JPG、PNG 或 WebP 文件。'); }
        finally { URL.revokeObjectURL(url); }
        if (!width || !height || width > 20000 || height > 20000) throw new Error('图片尺寸无效，长宽不能超过 20000 像素。');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('登录已过期，请重新登录。');
        path = `${user.id}/${crypto.randomUUID()}.${mimeExtensions[file.type]}`;
      }
      const input = { id: initial?.id, title, description, season, status, image_path: path, image_width: width, image_height: height };
      const parsed = uniformSchema.safeParse(input);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (file) {
        setProgress('正在上传图片…');
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error('图片上传失败，请检查网络、图片存储配置和管理权限。');
        uploadedPath = path;
      }
      setProgress('正在保存款式介绍…');
      mayBeReferenced = true;
      const result = await saveUniform(parsed.data);
      if (!result.ok) { mayBeReferenced = false; throw new Error(result.error); }
      router.push('/admin?notice=saved'); router.refresh();
    } catch (issue) {
      // A lost action response may still mean a committed record: keep its image.
      if (uploadedPath && !mayBeReferenced) await supabase.storage.from(BUCKET).remove([uploadedPath]);
      setError(issue instanceof Error ? issue.message : '保存失败，请稍后重试。');
    } finally { setBusy(false); setProgress(''); }
  }
  async function remove() {
    if (!initial || busy) return;
    setBusy(true); setError('');
    try {
      const result = await deleteUniform(initial.id);
      if (!result.ok) throw new Error(result.error);
      deleteDialog.current?.close(); router.push('/admin?notice=deleted'); router.refresh();
    } catch (issue) { deleteDialog.current?.close(); setError(issue instanceof Error ? issue.message : '删除失败，请重试。'); }
    finally { setBusy(false); }
  }
  return <>
    {error && <div className="alert error" role="alert">{error}</div>}
    <form onSubmit={event => { event.preventDefault(); startTransition(submit); }} className="editor" aria-busy={busy}>
      <section className="editor-panel"><h2>款式信息</h2>
        <label className="field"><span className="field-label">款式名称<span className="optional">{title.length} / 80</span></span><input value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：藏蓝白拼色运动套装" maxLength={80} required disabled={busy} /></label>
        <div className="editor-fields"><label className="field"><span className="field-label">所属季节</span><select value={season} onChange={e => setSeason(e.target.value as Season)} disabled={busy}>{Object.entries(seasonNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label><label className="field"><span className="field-label">发布状态</span><select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')} disabled={busy}><option value="draft">草稿</option><option value="published">已发布</option></select></label></div>
        <label className="field"><span className="field-label">款式介绍<span className="optional">{description.length} / 3000</span></span><textarea value={description} onChange={e => setDescription(e.target.value)} rows={8} maxLength={3000} required placeholder="介绍校服的颜色、款式、适用学校或其他信息…" disabled={busy} /><small>支持分段介绍。选择「已发布」并保存后，前台即可看到。</small></label>
        {progress && <p className="form-progress" role="status">{progress}</p>}
        <div className="form-footer"><button className="button" disabled={busy}>{busy ? '正在保存…' : status === 'published' ? '保存并发布' : '保存草稿'}</button><Link href="/admin" className="button secondary" aria-disabled={busy} onClick={e => { if (busy) e.preventDefault(); }}>取消</Link></div>
      </section>
      <aside className="editor-aside"><section className="editor-panel"><h2>校服图片</h2><div className={`upload-zone ${preview || initial ? 'has-image' : ''}`}>
        {preview ? <img className="preview-media" src={preview} alt="待上传图片预览" /> : initial ? <Media item={initial} className="preview-media" /> : <><Icon name="image" size={37} /><strong>添加一张校服图片</strong><span>让款式、颜色和细节看得更清楚</span></>}
      </div><label className="upload-button"><Icon name="upload" size={17} />{file || initial ? '更换图片' : '选择图片'}<input ref={fileInput} className="file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="上传校服图片" onChange={e => chooseFile(e.target.files?.[0])} disabled={busy} /></label><p className="upload-help">支持 JPG、PNG、WebP，单张不超过 5 MB。建议使用至少 1000 像素宽的清晰原图。{file && <><br />已选择：{file.name}</>}</p></section><div className="hint-card"><h3>发布前的小检查</h3><p>确认图片与款式名称一致，介绍信息准确。暂时不想公开时，可先保存为草稿。</p></div></aside>
    </form>
    {initial && <div className="delete-area"><button className="delete-link" type="button" disabled={busy} onClick={() => deleteDialog.current?.showModal()}>删除这条内容</button></div>}
    <dialog ref={deleteDialog} className="confirm-dialog"><h2>删除这条款式？</h2><p>「{initial?.title}」将从前台与后台移除，此操作无法撤销。</p><div className="confirm-actions"><button className="button secondary" onClick={() => deleteDialog.current?.close()} disabled={busy}>取消</button><button className="button danger" onClick={() => startTransition(remove)} disabled={busy}>{busy ? '正在删除…' : '确认删除'}</button></div></dialog>
  </>;
}
