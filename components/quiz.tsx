'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { grades, subjects, type Lesson, type LearningRecord } from '@/lib/types';
import { lessonVersion, readSession, saveRecord, sessionKey, saveSession, type Session } from '@/lib/progress';
import { Icon } from './icon';
import { removeStorage, CLOUD_UPDATED_EVENT } from '@/lib/members/storage';
import { useMember } from './members/member-provider';
export function Quiz({ lesson, preview = false }: { lesson: Lesson; preview?: boolean }) {
  const member=useMember();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<LearningRecord | null>(null);
  const [storageWarning, setStorageWarning] = useState('');
  const [speechMessage, setSpeechMessage] = useState('');
  const [reviewIds, setReviewIds] = useState<string[] | null>(null);
  const [reviewDone, setReviewDone] = useState(false);
  const [leave, setLeave] = useState(false);
  const clock = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const questions = reviewIds ? lesson.questions.filter(q => reviewIds.includes(q.id)) : lesson.questions;
  const index = session?.index ?? 0;
  const q = questions[index];
  const submitted = !!session && session.answers.length > index;
  useEffect(() => {
    const restored = preview ? null : readSession(lesson);
    const s = restored ?? { id: crypto.randomUUID(), version: lessonVersion(lesson), index: 0, answers: [], seconds: 0, startedAt: Date.now() };
    setSession(s); setSelected(s.answers[s.index] ?? null); setReady(true); clock.current = Date.now();
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, [lesson, preview]);
  useEffect(() => {
    if (!member || preview || reviewIds || result) return;
    function syncSession() {
      const remote=readSession(lesson);
      if(remote && session && remote.id===session.id && (remote.answers.length>session.answers.length || remote.index>session.index)){
        setSession(remote);setSelected(remote.answers[remote.index]??null);setHint(false);clock.current=Date.now();
      }
    }
    window.addEventListener(CLOUD_UPDATED_EVENT,syncSession);return ()=>window.removeEventListener(CLOUD_UPDATED_EVENT,syncSession);
  },[member,preview,reviewIds,result,lesson,session]);
  useEffect(() => { if (leave) dialog.current?.showModal(); else dialog.current?.close(); }, [leave]);
  useEffect(() => { if (ready) heading.current?.focus(); }, [index, ready, result, reviewDone]);
  function persist(s: Session) {
    setSession(s);
    if (preview || reviewIds) return;
    if (!saveSession(lesson.id,s)) setStorageWarning('浏览器存储不可用，请保持页面打开直到云端同步完成。');
  }
  function elapsed() { return Math.min(86400, (session?.seconds ?? 0) + Math.round((Date.now() - clock.current) / 1000)); }
  function confirm() {
    if (!session || selected === null || submitted) return;
    const seconds = elapsed(); clock.current = Date.now();
    persist({ ...session, seconds, answers: [...session.answers, selected] });
  }
  function advance() {
    if (!session || !submitted) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (index < questions.length - 1) {
      persist({ ...session, index: index + 1, seconds: elapsed() });
      clock.current = Date.now(); setSelected(null); setHint(false); setSpeechMessage(''); return;
    }
    if (reviewIds) { setReviewDone(true); return; }
    const wrongIds = lesson.questions.filter((question, i) => question.answer !== session.answers[i]).map(question => question.id);
    const record: LearningRecord = { id: session.id, lessonId: lesson.id, title: lesson.title, subject: lesson.subject, grade: lesson.grade, correct: questions.length - wrongIds.length, total: questions.length, seconds: elapsed(), completedAt: new Date().toISOString(), wrongIds };
    if (!preview) {
      if (!saveRecord(record)) setStorageWarning('本次已完成，但浏览器未能保存学习记录。');
      try { removeStorage(sessionKey(lesson.id)); } catch { /* warning already shown */ }
    }
    setResult(record);
  }
  function startReview() {
    if (!result?.wrongIds.length) return;
    setReviewIds(result.wrongIds); setSession({ id: crypto.randomUUID(), version: '', index: 0, answers: [], seconds: 0 });
    setSelected(null); setHint(false); setSpeechMessage(''); clock.current = Date.now();
  }
  function restart() {
    setReviewIds(null); setReviewDone(false); setResult(null); setSelected(null); setHint(false);
    const s = { id: crypto.randomUUID(), version: lessonVersion(lesson), index: 0, answers: [], seconds: 0, startedAt: Date.now() };
    setSession(s); clock.current = Date.now();
    if (!preview) saveSession(lesson.id,s);
  }
  function speak() {
    if (!('speechSynthesis' in window)) { setSpeechMessage('这个浏览器暂不支持朗读，可以直接阅读题目。'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${q.prompt}。${q.options.map((s,i) => `${String.fromCharCode(65+i)}，${s}`).join('。')}`);
    utterance.lang = 'zh-CN'; utterance.rate = 0.85;
    utterance.onerror = () => setSpeechMessage('朗读暂不可用，请直接阅读题目。');
    window.speechSynthesis.speak(utterance);
  }
  if (!ready || !session) return <div className="empty-state" role="status">正在准备小挑战…</div>;
  if (result && (!reviewIds || reviewDone)) return <main className={`quiz-shell result-shell ${preview ? 'preview-shell' : ''}`}><div className="result-heading"><span className="result-icon"><Icon name="check" size={35} /></span><p className="eyebrow">{reviewDone ? '再试一次，又有新收获' : '每一次尝试，都值得肯定'}</p><h1 ref={heading} tabIndex={-1}>{reviewDone ? '复习完成！' : '挑战完成！'}</h1><p className="lede">{reviewDone ? '把刚才的难题，再理解一遍。' : result.correct === result.total ? '全部答对了，继续保持好奇心！' : '认真想过的每一道题，都是进步。'}</p></div>
    <div className="result-stats panel"><div><span>完成题目</span><strong>{result.total}<small>题</small></strong></div><div><span>首次答对</span><strong>{result.correct}<small>题</small></strong></div><div><span>练习用时</span><strong>{Math.max(1, Math.ceil(result.seconds/60))}<small>分钟</small></strong></div></div>
    <section className="panel result-topic"><h2><Icon name="book" />今天练习了</h2><p>{lesson.topic}</p><span className="muted small">{lesson.title} · {grades[lesson.grade - 1]}{subjects[lesson.subject]}</span></section>
    {!!result.wrongIds.length && !reviewDone && <button className="review-card" onClick={startReview}><span><strong>再想一想，会更有收获</strong><small>{result.wrongIds.length} 道题值得再练一次</small></span><Icon name="arrow" /></button>}
    {storageWarning && <p className="notice" role="status">{storageWarning}</p>}{preview && <p className="notice">预览模式，不计入学习记录。</p>}
    <div className="result-actions"><button className="button full-width" onClick={restart}>再练一次<Icon name="arrow" size={18} /></button>{!preview && <Link className="button secondary full-width" href="/">回到今日挑战</Link>}</div></main>;
  return <main className={`quiz-shell ${preview ? 'preview-shell' : ''}`}>
    <header className="quiz-header">{preview ? <span className="pill">关卡预览</span> : <button className="icon-button" aria-label="离开练习" onClick={() => setLeave(true)}><Icon name="left" /></button>}<span>{reviewIds ? '再练一下' : lesson.title}</span><button className="icon-button" aria-label="朗读题目" onClick={speak}><Icon name="sound" /></button></header>
    <div className="quiz-progress"><div className="progress-track" role="progressbar" aria-label="答题进度" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index + (submitted ? 1 : 0)}><span style={{ width: `${(index + (submitted ? 1 : 0)) / questions.length * 100}%` }} /></div><span>第 {index + 1} / {questions.length} 题</span></div>
    <div className="question-heading"><span className="pill">{subjects[lesson.subject]} · {lesson.topic}</span><h1 ref={heading} tabIndex={-1}>{q.prompt}</h1></div>
    {q.context && <div className="question-context">{q.context}</div>}
    <div className="answers" role="group" aria-label="答案选项">{q.options.map((option,i) => <button key={i} disabled={submitted} aria-pressed={selected === i} className={`answer ${selected === i ? 'chosen' : ''} ${submitted && i === q.answer ? 'correct' : ''} ${submitted && selected === i && i !== q.answer ? 'incorrect' : ''}`} onClick={() => setSelected(i)}><span className="answer-letter">{String.fromCharCode(65+i)}</span><span>{option}</span>{submitted && i === q.answer && <Icon name="check" size={20} />}</button>)}</div>
    {!submitted && <div className="hint-area"><button className="text-link" onClick={() => setHint(!hint)} aria-expanded={hint}><Icon name="bulb" size={19} />{hint ? '收起提示' : '给我一点提示'}</button>{hint && <p className="hint-content">{q.hint}</p>}</div>}
    {submitted && <section className={`feedback ${selected === q.answer ? 'success' : 'retry'}`} role="status"><h2>{selected === q.answer ? '答对啦，想得很棒！' : '没关系，我们一起想一想'}</h2><p>{q.explanation}</p>{selected !== q.answer && <p className="correct-answer">正确答案：{q.options[q.answer]}</p>}</section>}
    {speechMessage && <p className="notice compact" role="status">{speechMessage}</p>}{storageWarning && <p className="notice compact" role="status">{storageWarning}</p>}
    <button className="button full-width quiz-submit" disabled={!submitted && selected === null} onClick={submitted ? advance : confirm}>{submitted ? index === questions.length - 1 ? '看看学习成果' : '下一题' : '确认答案'}<Icon name="arrow" size={18} /></button><p className="quiz-foot">{preview ? '这是管理员预览，不保存学习记录' : '不比速度，认真思考就很棒'}</p>
    <dialog ref={dialog} onCancel={() => setLeave(false)} onClose={() => setLeave(false)} className="confirm-dialog"><h2>先休息一下？</h2><p>已确认的答案会自动同步到会员账号，下次可以在任一设备继续。</p><div className="confirm-actions"><button className="button secondary" onClick={() => setLeave(false)}>继续练习</button><Link className="button" href="/">返回首页</Link></div></dialog>
  </main>;
}
