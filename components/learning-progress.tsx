'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { grades, subjects, type LearningRecord } from '@/lib/types';
import { dayKey, readRecords, RECORDS_KEY, RECORDS_CHANGED_EVENT, recordSchema, saveRecord } from '@/lib/progress';
import { clearDailyPlans } from '@/lib/recommendations';
import { Icon } from './icon';
import { useMember } from './members/member-provider';
export function LearningProgress({ availableIds }: { availableIds: string[] }) {
  const member=useMember();
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [legacy,setLegacy]=useState<LearningRecord[]>([]);
  useEffect(()=>{
    if(!member)return;
    try{const data:unknown=JSON.parse(localStorage.getItem(RECORDS_KEY)||'[]');if(Array.isArray(data))setLegacy(data.flatMap(r=>{const parsed=recordSchema.safeParse(r);return parsed.success?[parsed.data]:[]}).slice(-500));}catch{/* old cache unavailable */}
  },[member]);
  const importable=legacy.filter(r=>!records.some(current=>current.id===r.id));
  function importLegacy(){
    if(!window.confirm(`将这台设备的 ${importable.length} 条旧学习记录合并到会员“${member?.name}”？请确认这些记录属于该会员。`))return;
    for(const record of importable)saveRecord(record);
  }
  const [limit, setLimit] = useState(10);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const sync=()=>{setRecords(readRecords());setReady(true);};sync();window.addEventListener(RECORDS_CHANGED_EVENT,sync);return()=>window.removeEventListener(RECORDS_CHANGED_EVENT,sync); }, []);
  const total = records.reduce((n,r) => n+r.total,0);
  const days = new Set(records.map(r => dayKey(new Date(r.completedAt)))).size;
  const completed = new Set(records.map(r => r.lessonId)).size;
  function clear() {
    try { clearDailyPlans(); localStorage.removeItem(RECORDS_KEY); window.dispatchEvent(new Event(RECORDS_CHANGED_EVENT)); setRecords([]); dialog.current?.close(); }
    catch { setError('无法清除记录，请检查浏览器的存储设置。'); dialog.current?.close(); }
  }
  return <main className="container learning-main"><section className="page-heading"><div><p className="eyebrow"><span className="tiny-dot" />每一步，都有收获</p><h1>看见自己的小进步</h1><p className="lede">不用和别人比较，今天的你又多学了一点。</p></div><Link href="/practice" className="button secondary">去练习<Icon name="arrow" size={18} /></Link></section>
    <div className="stats-grid growth-stats"><div className="stat-card"><span>累计学习</span><strong>{days}<small>天</small></strong><p>每一次认真，都算数</p></div><div className="stat-card"><span>探索关卡</span><strong>{completed}<small>个</small></strong><p>一个知识点，一次新发现</p></div><div className="stat-card"><span>完成题目</span><strong>{total}<small>道</small></strong><p>一点点积累，一点点成长</p></div></div>
    <div className="section-heading"><h2>我的练习记录</h2><span className="small muted">{member ? '多端同步' : '仅保存在当前浏览器'}</span></div>
    {!ready ? <div className="empty-state" role="status">正在读取学习记录…</div> : !records.length ? <section className="empty-state panel"><span className="section-icon"><Icon name="leaf" size={28} /></span><h2>你的第一步，从这里开始</h2><p>完成一个小挑战，学习足迹就会出现在这里。</p><Link href="/practice" className="button">选一个小挑战<Icon name="arrow" size={17} /></Link></section> : <div className="panel history-list">{[...records].reverse().slice(0,limit).map(r => <div className="history-row" key={r.id}><span className={`subject-mark ${r.subject}`}>{subjects[r.subject].slice(0,1)}</span><div className="history-copy"><h3>{r.title}</h3><p>{grades[r.grade - 1]} · {subjects[r.subject]}<span className="separator">/</span>{new Date(r.completedAt).toLocaleDateString('zh-CN')}</p></div><div className="history-score"><strong>{r.correct}<small> / {r.total}</small></strong><span>首次答对</span></div>{availableIds.includes(r.lessonId) ? <Link href={`/learn/${r.lessonId}`} className="button secondary small">再练一次</Link> : <span className="muted small">已下架</span>}</div>)}</div>}
    {records.length > limit && <button className="button secondary load-more" onClick={() => setLimit(limit + 10)}>查看更多记录</button>}
    {member && importable.length>0 && <section className="panel daily-summary"><div><h2>发现本机旧学习记录</h2><p>{importable.length} 条记录尚未归属会员，确认属于你后可合并。</p></div><button className="button secondary" onClick={importLegacy}>导入本机旧记录</button></section>}
    <div className="record-note"><p>{member ? '学习记录保存在会员账号中，使用同一会员密码登录其他设备即可继续学习。' : '记录保存在当前浏览器。'}</p>{!member && records.length > 0 && <button className="text-button danger-text" onClick={() => dialog.current?.showModal()}>清除本机学习记录</button>}</div>{error && <p role="alert" className="notice error">{error}</p>}
    <dialog ref={dialog} className="confirm-dialog"><h2>清除本机学习记录？</h2><p>将移除这个浏览器中的所有已完成练习记录，清除后无法恢复。</p><div className="confirm-actions"><button className="button secondary" onClick={() => dialog.current?.close()}>保留记录</button><button className="button danger" onClick={clear}>确认清除</button></div></dialog>
  </main>;
}
