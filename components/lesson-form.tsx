'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteLesson, saveLesson } from '@/app/admin/actions';
import { grades, subjects, type Lesson, type Question } from '@/lib/types';
import { lessonSchema, type LessonInput } from '@/lib/validation';
import { Icon } from './icon';
import { Quiz } from './quiz';
function emptyQuestion(id: string): Question { return { id, prompt: '', context: '', options: ['','','',''], answer: 0, hint: '', explanation: '' }; }
export function LessonForm({ initial }: { initial?: Lesson }) {
  const router = useRouter();
  const [value, setValue] = useState<LessonInput>(() => initial ?? { title:'', description:'', subject:'math', grade:2, topic:'', minutes:3, status:'draft', questions:[emptyQuestion('30000000-0000-4000-8000-000000000001')] });
  const [active, setActive] = useState(0); const [dirty, setDirty] = useState(false); const [error, setError] = useState('');
  const [preview, setPreview] = useState<Lesson | null>(null); const [pending, start] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (e: BeforeUnloadEvent) => { if(dirty) {e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload',handle); return () => window.removeEventListener('beforeunload',handle);
  },[dirty]);
  useEffect(() => { if (error) errorRef.current?.focus(); },[error]);
  function update(fields: Partial<LessonInput>) { setValue(v => ({...v,...fields})); setDirty(true); }
  function updateQuestion(fields: Partial<Question>) { update({questions:value.questions.map((q,i) => i === active ? {...q,...fields} : q)}); }
  function validate() {
    const parsed = lessonSchema.safeParse(value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const idx = issue.path[0] === 'questions' && typeof issue.path[1] === 'number' ? issue.path[1] : null;
      if (idx !== null) setActive(idx);
      setError(`${idx !== null ? `第${idx+1}题：` : ''}${issue.message}`); return null;
    }
    setError(''); return parsed.data;
  }
  function save() {
    const data = validate(); if(!data) return;
    start(async () => {
      try {
        const response = await saveLesson(data, initial?.updated_at);
        if (!response.ok) {setError(response.error!);return;}
        setDirty(false); router.push('/admin?saved=1'); router.refresh();
      } catch {setError('网络异常，内容尚未保存，请保留页面并稍后重试。');}
    });
  }
  function showPreview() {
    const data = validate(); if (!data) return;
    setPreview({...data, id:data.id ?? '40000000-0000-4000-8000-000000000001', created_at:'', updated_at:''});
  }
  function removeLesson() {
    if(!initial) return;
    start(async () => {
      try {const r = await deleteLesson(initial.id); if(!r.ok) { setError(r.error!); dialog.current?.close(); return; } setDirty(false); router.push('/admin'); router.refresh();}
      catch {setError('网络异常，删除未完成，请稍后重试。');dialog.current?.close();}
    });
  }
  const q = value.questions[active];
  if (preview) return <div><div className="preview-bar"><span>学生视角预览 · 不保存练习记录</span><button className="button secondary small" onClick={() => setPreview(null)}><Icon name="left" size={16} />返回编辑</button></div><Quiz lesson={preview} preview /></div>;
  return <><div className="editor-heading"><div><Link href="/admin" className="back-link" onClick={e => {if(dirty && !window.confirm('尚有未保存的修改，确定返回吗？')) e.preventDefault();}}><Icon name="left" size={16} />返回关卡管理</Link><h1>{initial ? '编辑学习关卡' : '创建一个小挑战'}</h1><p className="lede">好的问题，让每一次思考都有收获。</p></div><button className="button secondary" onClick={showPreview} disabled={pending}><Icon name="book" size={18} />预览关卡</button></div>
    {error && <div className="notice error" ref={errorRef} tabIndex={-1} role="alert">{error}</div>}
    <form onSubmit={e => {e.preventDefault();save();}} noValidate><fieldset disabled={pending} className="editor-fieldset"><div className="editor-layout"><div className="editor-primary">
      <section className="panel editor-panel"><div className="section-heading"><h2><span className="step-number">01</span>关卡信息</h2><span className="small muted">让孩子知道将学到什么</span></div>
        <label className="field"><span className="field-label">关卡名称</span><input value={value.title} maxLength={60} placeholder="例如：小小商店开门啦" onChange={e => update({title:e.target.value})} /></label>
        <label className="field"><span className="field-label">关卡简介</span><textarea value={value.description} maxLength={200} rows={2} placeholder="用一句话介绍这个有趣的小挑战" onChange={e => update({description:e.target.value})} /></label>
        <div className="form-grid"><label className="field"><span className="field-label">学科</span><select value={value.subject} onChange={e => update({subject:e.target.value as LessonInput['subject']})}>{Object.entries(subjects).map(([s,n]) => <option key={s} value={s}>{n}</option>)}</select></label><label className="field"><span className="field-label">适用年级</span><select value={value.grade} onChange={e => update({grade:Number(e.target.value)})}>{grades.map((g,i) => <option key={g} value={i+1}>{g}</option>)}</select></label><label className="field"><span className="field-label">知识点</span><input value={value.topic} maxLength={40} placeholder="例如：生活中的加减法" onChange={e => update({topic:e.target.value})} /></label><label className="field"><span className="field-label">预计用时（分钟）</span><input type="number" min={1} max={30} value={value.minutes} onChange={e => update({minutes:Number(e.target.value)})} /></label></div>
      </section>
      <section className="panel editor-panel"><div className="section-heading"><h2><span className="step-number">02</span>题目编辑</h2><span className="small muted">{value.questions.length} / 20 道</span></div><div className="question-tabs" aria-label="选择题目">{value.questions.map((question,i) => <button type="button" aria-pressed={active === i} className={active === i ? 'active' : ''} key={question.id} onClick={() => setActive(i)}>第{i+1}题</button>)}<button type="button" aria-label="添加题目" disabled={value.questions.length >= 20} onClick={() => {update({questions:[...value.questions,emptyQuestion(crypto.randomUUID())]});setActive(value.questions.length);}}><Icon name="plus" size={17} /></button></div>
        <label className="field"><span className="field-label">题目</span><textarea value={q.prompt} rows={2} maxLength={300} placeholder="例如：苹果3元，牛奶5元，一共多少钱？" onChange={e => updateQuestion({prompt:e.target.value})} /></label>
        <label className="field"><span className="field-label">辅助信息<span className="optional">选填</span></span><input value={q.context} maxLength={200} placeholder="例如：苹果 3元 ｜ 牛奶 5元" onChange={e => updateQuestion({context:e.target.value})} /></label>
        <div className="field"><div className="field-label">答案选项<span className="optional">勾选圆圈设置正确答案</span></div><div className="option-editor">{q.options.map((option,i) => <div className={`option-input ${q.answer === i ? 'is-answer' : ''}`} key={i}><input type="radio" name={`answer-${q.id}`} aria-label={`设置选项${String.fromCharCode(65+i)}为正确答案`} checked={q.answer === i} onChange={() => updateQuestion({answer:i})} /><span>{String.fromCharCode(65+i)}</span><input aria-label={`选项${String.fromCharCode(65+i)}`} value={option} maxLength={100} placeholder={`输入选项${String.fromCharCode(65+i)}`} onChange={e => updateQuestion({options:q.options.map((s,j) => i === j ? e.target.value : s)})} />{q.answer === i && <span className="correct-option-label">正确答案</span>}</div>)}</div></div>
        <label className="field"><span className="field-label">答题提示</span><textarea value={q.hint} maxLength={300} rows={2} placeholder="引导思考，不直接给出答案" onChange={e => updateQuestion({hint:e.target.value})} /></label>
        <label className="field"><span className="field-label">答案解析</span><textarea value={q.explanation} maxLength={600} rows={3} placeholder="用孩子能理解的语言，说明为什么这样解答" onChange={e => updateQuestion({explanation:e.target.value})} /></label>
        <div className="question-tools"><button type="button" className="text-button" disabled={active === 0} onClick={() => {const list=[...value.questions];[list[active-1],list[active]]=[list[active],list[active-1]];update({questions:list});setActive(active-1);}}>向前移动</button><button type="button" className="text-button" disabled={active === value.questions.length-1} onClick={() => {const list=[...value.questions];[list[active+1],list[active]]=[list[active],list[active+1]];update({questions:list});setActive(active+1);}}>向后移动</button><button type="button" className="text-button danger-text" disabled={value.questions.length <= 1} onClick={() => {if(window.confirm(`删除第${active+1}题？保存关卡后生效。`)){update({questions:value.questions.filter((_,i) => i !== active)});setActive(Math.max(0,active-1));}}}><Icon name="trash" size={15} />删除此题</button></div>
      </section>
    </div><aside className="editor-aside"><section className="panel editor-panel"><h2>发布设置</h2><label className="publish-option"><input type="radio" name="status" checked={value.status === 'draft'} onChange={() => update({status:'draft'})} /><span><strong>保存为草稿</strong><small>仅管理员可见，继续完善内容</small></span></label><label className="publish-option"><input type="radio" name="status" checked={value.status === 'published'} onChange={() => update({status:'published'})} /><span><strong>发布到前台</strong><small>保存后学生即可开始练习</small></span></label><div className="publish-summary"><span>{grades[value.grade-1]} · {subjects[value.subject]}</span><span>{value.questions.length} 道题 · 约 {value.minutes} 分钟</span></div><button className="button full-width" type="submit" disabled={pending}>{pending ? '正在保存…' : value.status === 'published' ? '保存并发布' : '保存草稿'}<Icon name="check" size={17} /></button>{dirty && <p className="small muted unsaved-note">有未保存的修改</p>}</section><section className="tip-card"><Icon name="bulb" size={20} /><div><h3>出题小建议</h3><p>每关聚焦一个知识点，建议3～5道题。提示引导思考，解析讲清原因。</p></div></section>{initial && <button type="button" className="delete-lesson text-button danger-text" disabled={pending} onClick={() => dialog.current?.showModal()}><Icon name="trash" size={16} />删除这个关卡</button>}</aside></div></fieldset></form>
    <dialog ref={dialog} className="confirm-dialog"><h2>删除这个关卡？</h2><p>「{value.title}」及其全部题目将从题库移除，无法撤销。学生已保存的学习记录仍会保留。</p><div className="confirm-actions"><button className="button secondary" disabled={pending} onClick={() => dialog.current?.close()}>取消</button><button className="button danger" disabled={pending} onClick={removeLesson}>{pending ? '正在删除…' : '确认删除'}</button></div></dialog>
  </>;
}
