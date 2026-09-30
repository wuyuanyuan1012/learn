'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { grades, subjects, type LessonSummary, type LearningRecord, type Subject } from '@/lib/types';
import { dayKey, GRADE_KEY, readRecords, weekDays } from '@/lib/progress';
import { Icon } from './icon';
const subjectMarks = { math: '＋', chinese: '文', english: 'Aa', science: '科' };
export function LearningHome({ lessons, demo, library = false }: { lessons: LessonSummary[]; demo: boolean; library?: boolean }) {
  const [grade, setGrade] = useState(2);
  const [subject, setSubject] = useState<Subject | 'all'>('all');
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [query, setQuery] = useState('');
  const [today, setToday] = useState('');
  const [days, setDays] = useState<string[]>([]);
  useEffect(() => {
    setRecords(readRecords()); setToday(dayKey(new Date())); setDays(weekDays());
    try { const n = Number(localStorage.getItem(GRADE_KEY)); if (n >= 1 && n <= 6) setGrade(n); } catch { /* device storage is optional */ }
  }, []);
  const studiedDays = new Set(records.map(r => dayKey(new Date(r.completedAt))));
  const completed = new Set(records.map(r => r.lessonId));
  const todayCompleted = new Set(records.filter(r => dayKey(new Date(r.completedAt)) === today).map(r => r.lessonId));
  const forGrade = lessons.filter(l => l.grade === grade);
  const featured = forGrade.find(l => !todayCompleted.has(l.id)) ?? forGrade[0];
  const filtered = forGrade.filter(l => (subject === 'all' || l.subject === subject) && `${l.title}${l.topic}`.includes(query.trim()));
  const studiedWeek = days.filter(d => studiedDays.has(d)).length;
  function changeGrade(n: number) { setGrade(n); try { localStorage.setItem(GRADE_KEY, String(n)); } catch { /* optional */ } }
  return <main className="container learning-main">
    <section className="page-heading"><div><p className="eyebrow"><span className="tiny-dot" />每天一点新发现</p><h1>{library ? '找到你的下一次挑战' : '今天想学点什么？'}</h1><p className="lede">{library ? '从喜欢的知识点开始，按自己的节奏慢慢来。' : '每天学一点，让好奇心多一点。'}</p></div><label className="grade-select"><span>学习年级</span><select aria-label="学习年级" value={grade} onChange={e => changeGrade(Number(e.target.value))}>{grades.map((g, i) => <option value={i+1} key={g}>{g}</option>)}</select></label></section>
    {demo && <p className="notice compact">正在体验示例题库。<Link href="/admin">管理员连接题库后可发布新关卡 →</Link></p>}
    <div className="learning-grid"><div className="learning-content">
      {!library && featured && <section className="daily-card"><div className="daily-top"><span className="pill amber"><Icon name="flag" size={14} />今日小挑战</span><span className="muted small">{grades[grade - 1]} · {subjects[featured.subject]}</span></div><h2>{featured.title}</h2><p>{featured.description}</p><div className="daily-bottom"><div className="meta"><span><Icon name="book" size={16} />{featured.questionCount} 道小题</span><span><Icon name="clock" size={16} />约 {featured.minutes} 分钟</span></div><Link className="button" href={`/learn/${featured.id}`}>开始挑战<Icon name="arrow" size={18} /></Link></div></section>}
      <section className="lesson-section"><div className="section-heading"><h2>{library ? '全部练习' : '选个知识点'}</h2><span className="muted small">{forGrade.length} 个关卡，等你探索</span></div>
        <div className="filter-line"><div className="subject-tabs" role="group" aria-label="学科筛选">{([['all','全部'], ...Object.entries(subjects)]).map(([key,label]) => <button key={key} className={subject === key ? 'selected' : ''} aria-pressed={subject === key} onClick={() => setSubject(key as Subject | 'all')}>{label}</button>)}</div></div>
        {library && <label className="search-box"><Icon name="search" size={18} /><input aria-label="搜索关卡" placeholder="搜索关卡或知识点" value={query} onChange={e => setQuery(e.target.value)} /></label>}
        <div className="lesson-grid">{filtered.map((l, i) => <Link href={`/learn/${l.id}`} className="lesson-card" key={l.id}><div className="lesson-card-top"><span className={`subject-mark ${l.subject}`}>{subjectMarks[l.subject]}</span><span className="lesson-number">{String(i + 1).padStart(2,'0')}</span></div><div className="lesson-copy"><span className={`subject-name ${l.subject}`}>{subjects[l.subject]} · {l.topic}</span><h3>{l.title}</h3><p>{l.description}</p></div><div className="lesson-card-bottom"><span>{l.questionCount} 道题 <span className="separator">·</span> {l.minutes} 分钟</span>{completed.has(l.id) ? <span className="completed-label"><Icon name="check" size={14} />已练习</span> : <Icon name="arrow" size={17} />}</div></Link>)}</div>
        {!filtered.length && <div className="empty-state panel"><Icon name="book" size={30} /><h3>{query ? '还没有找到这个关卡' : '新知识正在准备中'}</h3><p>{query ? '换个关键词，或看看其他学科。' : '试试其他年级或学科，稍后再来探索吧。'}</p><button className="button secondary" onClick={() => { setSubject('all'); setQuery(''); changeGrade(2); }}>看看二年级的全部关卡</button></div>}
      </section>
    </div><aside className="learning-aside"><section className="panel week-card"><div className="section-heading"><h2>一点一滴，都算数</h2><Icon name="leaf" size={19} /></div><p className="muted">本周已学 <strong>{studiedWeek}</strong> 天</p><div className="week-grid">{['一','二','三','四','五','六','日'].map((label,i) => <div key={label}><span>{label}</span><span className={`day-circle ${studiedDays.has(days[i]) ? 'done' : ''} ${days[i] === today ? 'today' : ''}`} aria-label={`周${label}${studiedDays.has(days[i]) ? '已学习' : '未学习'}`}>{studiedDays.has(days[i]) ? <Icon name="check" size={14} /> : <span />}</span></div>)}</div><div className="week-note">不用着急，每一次尝试都是进步。</div></section>
      <section className="panel progress-card"><span className="small muted">我的学习足迹</span><div className="progress-count"><strong>{completed.size}</strong><span>个关卡已练习</span></div><Link className="text-link" href="/progress">看看我的成长<Icon name="arrow" size={16} /></Link></section>
      <section className="tip-card"><span className="tip-icon"><Icon name="bulb" size={19} /></span><div><h3>不会也没关系</h3><p>遇到难题时，点一下「给我一点提示」。想一想，再试一试。</p></div></section><p className="aside-foot">为好奇心留一点时间。<br />趣味学习 · 快乐探索每一天</p>
    </aside></div><footer className="site-footer"><span>趣味学习<span className="separator">/</span>小小练习，大大发现</span><span>学习记录保存在当前浏览器</span></footer>
  </main>;
}
