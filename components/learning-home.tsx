'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { grades, subjects, type LessonSummary, type LearningRecord, type Subject } from '@/lib/types';
import { dayKey, GRADE_KEY, readRecords, weekDays, RECORDS_KEY, RECORDS_CHANGED_EVENT, saveGrade } from '@/lib/progress';
import { Icon } from './icon';
import { readStorage, storageKey, CLOUD_UPDATED_EVENT } from '@/lib/members/storage';
import { availableCategories, categoryName, lessonMatchesQuery } from '@/lib/classification';
import { DAILY_PLAN_PREFIX, loadDailyPlan, selectDailyRecommendations, recommendationReasons, type DailyPlan } from '@/lib/recommendations';
const subjectMarks = { math: '＋', chinese: '文', english: 'Aa', science: '科' };
export function LearningHome({ lessons, demo, library = false }: { lessons: LessonSummary[]; demo: boolean; library?: boolean }) {
  const [grade, setGrade] = useState(2);
  const [subject, setSubject] = useState<Subject | 'all'>('all');
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [today, setToday] = useState('');
  const [days, setDays] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [recommendations, setRecommendations] = useState<ReturnType<typeof selectDailyRecommendations>>([]);
  const [recommendationGrade, setRecommendationGrade] = useState<number | null>(null);
  const memoryPlans = useRef(new Map<number, DailyPlan>());
  useEffect(() => {
    try { const n = Number(readStorage(GRADE_KEY)); if (n >= 1 && n <= 6) setGrade(n); } catch { /* device storage is optional */ }
    setInitialized(true);
  }, []);
  useEffect(() => {
    if (!initialized) return;
    let timer: ReturnType<typeof setTimeout>;
    function sync() {
      clearTimeout(timer);
      const now = new Date(), history = readRecords();
      setRecords(history); setToday(dayKey(now)); setDays(weekDays(now));
      if (!library) {
        const plan = loadDailyPlan(lessons, history, grade, now, memoryPlans.current.get(grade));
        memoryPlans.current.set(grade, plan);
        setRecommendations(selectDailyRecommendations(plan, lessons, history, now));
        setRecommendationGrade(grade);
      }
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(sync, midnight.getTime() - now.getTime() + 25);
    }
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === storageKey(RECORDS_KEY) || e.key === storageKey(`${DAILY_PLAN_PREFIX}${grade}`)) sync();
    }
    function onCloud() { const saved=Number(readStorage(GRADE_KEY)); if(saved>=1&&saved<=6)setGrade(saved); sync(); }
    function onVisible() { if (document.visibilityState === 'visible') sync(); }
    sync();
    window.addEventListener(CLOUD_UPDATED_EVENT,onCloud);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', sync);
    window.addEventListener('pageshow', sync);
    window.addEventListener(RECORDS_CHANGED_EVENT, sync);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(CLOUD_UPDATED_EVENT,onCloud);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', sync);
      window.removeEventListener('pageshow', sync);
      window.removeEventListener(RECORDS_CHANGED_EVENT, sync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [initialized, grade, lessons, library]);
  const studiedDays = new Set(records.map(r => dayKey(new Date(r.completedAt))));
  const completed = new Set(records.map(r => r.lessonId));
  const forGrade = lessons.filter(l => l.grade === grade);
  const recommendationReady = initialized && recommendationGrade === grade;
  const challenges = recommendationReady ? recommendations : [];
  const completedChallenges = challenges.filter(c => c.completed).length;
  const allChallengesDone = challenges.length > 0 && completedChallenges === challenges.length;
  const categoryOptions = subject === 'all' ? [] : availableCategories(forGrade, subject);
  const filtered = forGrade.filter(l => (subject === 'all' || l.subject === subject) && (category === 'all' || l.category === category) && lessonMatchesQuery(l, query));
  const studiedWeek = days.filter(d => studiedDays.has(d)).length;
  function changeGrade(n: number) { setGrade(n); setCategory('all'); saveGrade(n); }
  return <main className="container learning-main">
    <section className="page-heading"><div><p className="eyebrow"><span className="tiny-dot" />每天一点新发现</p><h1>{library ? '全部练习' : '今日挑战'}</h1><p className="lede">{library ? '按学科和知识分类，找到想练习的内容。' : '每个学科一个小挑战，每关 10 道题，选一科开始吧。'}</p></div><label className="grade-select"><span>学习年级</span><select aria-label="学习年级" value={grade} onChange={e => changeGrade(Number(e.target.value))}>{grades.map((g, i) => <option value={i+1} key={g}>{g}</option>)}</select></label></section>
    {demo && <p className="notice compact">正在体验示例题库。<Link href="/admin">管理员连接题库后可发布新关卡 →</Link></p>}
    <div className="learning-grid"><div className="learning-content">
      {!library && <>
        {recommendationReady && challenges.length > 0 && <section className="panel daily-summary" aria-label="今日学习情况"><div><h2>今天的小进步</h2><p>今日挑战已完成 {completedChallenges} / {challenges.length} 科</p></div><Link className="text-link" href="/practice">浏览全部练习<Icon name="arrow" size={16} /></Link></section>}
        {!recommendationReady && forGrade.length > 0 && <section className="daily-card" role="status">正在安排各学科的今日挑战…</section>}
        {allChallengesDone && <section className="panel daily-summary" aria-label="今日推荐已完成"><div><h2>今日挑战全部完成啦</h2><p>休息一下，明天再来发现新知识。</p></div><Link className="text-link" href="/practice">自由练习<Icon name="arrow" size={16} /></Link></section>}
        <div className="daily-challenge-grid">{challenges.map(({lesson: l, kind, completed: done}) => <section className={`daily-card subject-challenge${done ? ' challenge-done' : ''}`} aria-label={`${subjects[l.subject]}今日挑战`} key={l.subject}>
          <div className="daily-top"><span className={`subject-mark ${l.subject}`}>{subjectMarks[l.subject]}</span><span className="challenge-subject">{subjects[l.subject]}<span className="muted small">{grades[grade - 1]} · {categoryName(l.subject, l.category)}</span></span><span className={`pill ${done ? '' : 'amber'}`}>{done ? '已完成' : '待挑战'}</span></div>
          <h2>{l.title}</h2><p>{l.description}</p><p className="recommendation-reason"><Icon name={done ? 'check' : 'bulb'} size={15} />{done ? '今天这一科的挑战完成啦' : recommendationReasons[kind]}</p>
          <div className="daily-bottom"><div className="meta"><span><Icon name="book" size={16} />{l.questionCount} 道题</span><span><Icon name="clock" size={16} />约 {l.minutes} 分钟</span></div><Link className={`button${done ? ' secondary' : ''}`} href={`/learn/${l.id}`}>{done ? '再练一次' : '开始挑战'}<Icon name="arrow" size={18} /></Link></div>
        </section>)}</div>
      </>}
      {!library && !forGrade.length && <section className="empty-state panel"><Icon name="book" size={30} /><h2>这个年级的挑战正在准备中</h2><p>可以切换年级，或到全部练习里看看。</p><Link className="button secondary" href="/practice">浏览全部练习</Link></section>}
      {library && <section className="lesson-section"><div className="section-heading"><h2>选择练习内容</h2><span className="muted small">{filtered.length} 个关卡，等你探索</span></div>
        <div className="filter-line"><div className="subject-tabs" role="group" aria-label="学科筛选">{([['all','全部'], ...Object.entries(subjects)]).map(([key,label]) => <button key={key} className={subject === key ? 'selected' : ''} aria-pressed={subject === key} onClick={() => { setSubject(key as Subject | 'all'); setCategory('all'); }}>{label}</button>)}</div></div>
        {categoryOptions.length > 0 && <div className="category-filters" role="group" aria-label="知识分类筛选"><button className={category === 'all' ? 'selected' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>全部分类</button>{categoryOptions.map(c => <button key={c.id} className={category === c.id ? 'selected' : ''} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.name}<span className="category-count" aria-hidden="true">{c.count}</span></button>)}</div>}
        {library && <label className="search-box"><Icon name="search" size={18} /><input aria-label="搜索关卡" placeholder="搜索关卡、分类或知识点标签" value={query} onChange={e => setQuery(e.target.value)} /></label>}
        <div className="lesson-grid">{filtered.map((l, i) => <Link href={`/learn/${l.id}`} className="lesson-card" key={l.id}><div className="lesson-card-top"><span className={`subject-mark ${l.subject}`}>{subjectMarks[l.subject]}</span><span className="lesson-number">{String(i + 1).padStart(2,'0')}</span></div><div className="lesson-copy"><span className={`subject-name ${l.subject}`}>{subjects[l.subject]} · {categoryName(l.subject, l.category)}</span><h3>{l.title}</h3><p>{l.description}</p><div className="lesson-tags" aria-label="知识点标签">{(l.tags.length ? l.tags : [l.topic]).slice(0,3).map(tag => <span key={tag}>{tag}</span>)}</div></div><div className="lesson-card-bottom"><span>{l.questionCount} 道题 <span className="separator">·</span> {l.minutes} 分钟</span>{completed.has(l.id) ? <span className="completed-label"><Icon name="check" size={14} />已练习</span> : <Icon name="arrow" size={17} />}</div></Link>)}</div>
        {!filtered.length && <div className="empty-state panel"><Icon name="book" size={30} /><h3>{query ? '还没有找到这个关卡' : '新知识正在准备中'}</h3><p>{query ? '换个关键词，或看看其他学科。' : '试试其他年级或学科，稍后再来探索吧。'}</p><button className="button secondary" onClick={() => { setSubject('all'); setQuery(''); changeGrade(2); }}>看看二年级的全部关卡</button></div>}
      </section>}
    </div><aside className="learning-aside"><section className="panel week-card"><div className="section-heading"><h2>一点一滴，都算数</h2><Icon name="leaf" size={19} /></div><p className="muted">本周已学 <strong>{studiedWeek}</strong> 天</p><div className="week-grid">{['一','二','三','四','五','六','日'].map((label,i) => <div key={label}><span>{label}</span><span className={`day-circle ${studiedDays.has(days[i]) ? 'done' : ''} ${days[i] === today ? 'today' : ''}`} aria-label={`周${label}${studiedDays.has(days[i]) ? '已学习' : '未学习'}`}>{studiedDays.has(days[i]) ? <Icon name="check" size={14} /> : <span />}</span></div>)}</div><div className="week-note">不用着急，每一次尝试都是进步。</div></section>
      <section className="panel progress-card"><span className="small muted">我的学习足迹</span><div className="progress-count"><strong>{completed.size}</strong><span>个关卡已练习</span></div><Link className="text-link" href="/progress">看看我的成长<Icon name="arrow" size={16} /></Link></section>
      <section className="tip-card"><span className="tip-icon"><Icon name="bulb" size={19} /></span><div><h3>不会也没关系</h3><p>遇到难题时，点一下「给我一点提示」。想一想，再试一试。</p></div></section><p className="aside-foot">为好奇心留一点时间。<br />趣味学习 · 快乐探索每一天</p>
    </aside></div><footer className="site-footer"><span>趣味学习<span className="separator">/</span>小小练习，大大发现</span><span>学习进度自动同步到会员账号</span></footer>
  </main>;
}
