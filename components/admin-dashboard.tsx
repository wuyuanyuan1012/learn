'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { grades, subjects, type LessonSummary, type Subject } from '@/lib/types';
import { importLessons } from '@/app/admin/actions';
import { Icon } from './icon';
import { categories, categoryName, lessonMatchesQuery } from '@/lib/classification';
export function AdminDashboard({ lessons, saved }: { lessons: LessonSummary[]; saved: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState(''); const [subject, setSubject] = useState('all');
  const [category, setCategory] = useState('all');
  const [grade, setGrade] = useState('all'); const [status, setStatus] = useState('all'); const [page, setPage] = useState(1);
  const [message, setMessage] = useState(''); const [error, setError] = useState(false); const [pending, start] = useTransition();
  const published = lessons.filter(l => l.status === 'published').length;
  const filtered = lessons.filter(l => lessonMatchesQuery(l, search) && (category === 'all' || l.category === category) && (subject === 'all' || l.subject === subject) && (grade === 'all' || l.grade === Number(grade)) && (status === 'all' || l.status === status));
  const pages = Math.max(1, Math.ceil(filtered.length / 10)); const current = Math.min(page, pages);
  function importSeed() { start(async () => {
    try { const result = await importLessons(); setError(!result.ok); setMessage(result.ok ? '示例题库已导入，已有同编号关卡保持不变。' : result.error!); if (result.ok) router.refresh(); }
    catch { setError(true); setMessage('网络异常，导入未完成，请稍后重试。'); }
  }); }
  return <>
    <div className="admin-top"><div><p className="eyebrow">趣味学习</p><h1>关卡管理</h1><p>管理学习关卡与题目，把知识变成有趣的小挑战。</p></div><Link href="/admin/new" className="button"><Icon name="plus" size={18} />新建关卡</Link></div>
    <div className="stats-grid admin-stats"><div className="stat-card"><span>全部关卡<Icon name="book" /></span><strong>{lessons.length}<small>个</small></strong><p>题库里的每一份知识</p></div><div className="stat-card"><span>已发布<Icon name="check" /></span><strong>{published}<small>个</small></strong><p>学生可在前台练习</p></div><div className="stat-card"><span>草稿箱<Icon name="edit" /></span><strong>{lessons.length - published}<small>个</small></strong><p>打磨好后再与大家见面</p></div><div className="stat-card"><span>题目总数<Icon name="grid" /></span><strong>{lessons.reduce((n,l) => n+l.questionCount,0)}<small>道</small></strong><p>每道题都有提示与解析</p></div></div>
    {(message || saved) && <div className={`notice ${error ? 'error' : ''}`} role="status">{message || '关卡保存成功。'}</div>}
    <section className="panel admin-library"><div className="section-heading"><div><h2>全部关卡</h2><p className="muted small">编辑内容，准备好后发布到学习前台。</p></div><button className="button secondary small" disabled={pending} onClick={importSeed}>{pending ? '正在导入…' : '导入示例题库'}</button></div>
      <div className="admin-filters"><label className="search-box"><Icon name="search" size={18} /><input aria-label="搜索关卡" placeholder="搜索关卡、分类、标签…" value={search} onChange={e => {setSearch(e.target.value);setPage(1);}} /></label><select aria-label="筛选学科" value={subject} onChange={e => {setSubject(e.target.value);setCategory('all');setPage(1);}}><option value="all">全部学科</option>{Object.entries(subjects).map(([s,name]) => <option value={s} key={s}>{name}</option>)}</select><select aria-label="筛选分类" value={category} onChange={e => {setCategory(e.target.value);setPage(1);}}><option value="all">全部分类</option>{(subject === 'all' ? Object.keys(subjects) as Subject[] : [subject as Subject]).map(s => <optgroup key={s} label={subjects[s]}>{categories[s].map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}</select><select aria-label="筛选年级" value={grade} onChange={e => {setGrade(e.target.value);setPage(1);}}><option value="all">全部年级</option>{grades.map((g,i) => <option value={i+1} key={g}>{g}</option>)}</select><select aria-label="筛选状态" value={status} onChange={e => {setStatus(e.target.value);setPage(1);}}><option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option></select></div>
      <div className="table-scroll"><table className="lesson-table"><thead><tr><th>关卡名称 / 分类 / 标签</th><th>学科 / 年级</th><th>题目</th><th>状态</th><th>最近更新</th><th>操作</th></tr></thead><tbody>{filtered.slice((current-1)*10,current*10).map(l => <tr key={l.id}><td><strong>{l.title}</strong><span>{categoryName(l.subject, l.category)} · {l.tags.length ? l.tags.join('、') : l.topic}</span></td><td>{subjects[l.subject]}<span>{grades[l.grade-1]}</span></td><td>{l.questionCount} 道</td><td><span className={`status ${l.status}`}><i />{l.status === 'published' ? '已发布' : '草稿'}</span></td><td className="muted">{new Date(l.updated_at).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'})}</td><td><Link className="edit-link" href={`/admin/${l.id}/edit`}><Icon name="edit" size={16} />编辑</Link></td></tr>)}</tbody></table></div>
      {!filtered.length && <div className="empty-state"><Icon name="book" size={28} /><h3>{lessons.length ? '没有符合条件的关卡' : '从第一个小挑战开始'}</h3><p>{lessons.length ? '试试调整筛选条件。' : '新建关卡，或导入9个关卡、90道示例题。'}</p></div>}
      <div className="table-footer"><span>共 {filtered.length} 个关卡</span><div><button className="icon-button" disabled={current <= 1} aria-label="上一页" onClick={() => setPage(current-1)}><Icon name="left" size={17} /></button><span>{current} / {pages}</span><button className="icon-button" disabled={current >= pages} aria-label="下一页" onClick={() => setPage(current+1)}><Icon name="right" size={17} /></button></div></div>
    </section><p className="admin-tip"><Icon name="bulb" size={16} />发布前请核对题目、正确答案和解析。会员与密码在会员管理中维护，学习进度自动同步到对应账号。</p>
  </>;
}
