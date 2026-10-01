'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveMember } from '@/app/admin/members/actions';
import { grades } from '@/lib/types';
type MemberRow={id:string;name:string;grade:number;active:boolean;created_at:string};
export function MemberManager({members}:{members:MemberRow[]}){
 const router=useRouter();
 const [editing,setEditing]=useState<MemberRow|null>(null),[name,setName]=useState(''),[grade,setGrade]=useState(2),[active,setActive]=useState(true),[password,setPassword]=useState(''),[generate,setGenerate]=useState(true),[message,setMessage]=useState(''),[shownPassword,setShownPassword]=useState(''),[error,setError]=useState(''),[search,setSearch]=useState('');
 const [pending,start]=useTransition();
 function edit(member:MemberRow|null){setEditing(member);setName(member?.name??'');setGrade(member?.grade??2);setActive(member?.active??true);setPassword('');setGenerate(!member);setError('');setMessage('');setShownPassword('');}
 return <><div className="admin-top"><div><p className="eyebrow">趣味学习</p><h1>会员管理</h1><p>创建会员，分配密码，让学习进度跟着账号走。</p></div></div>
 <section className="panel member-editor"><h2>{editing?'编辑会员':'创建会员'}</h2><form onSubmit={e=>{e.preventDefault();setError('');setShownPassword('');start(async()=>{
  try{const result=await saveMember({id:editing?.id,name,grade,active,password:password||undefined,generate});if(!result.ok){setError(result.error!);return;}setMessage(editing?'会员已更新。':'会员已创建。');setShownPassword(result.password??'');setPassword('');if(!editing){setName('');}router.refresh();}
  catch{setError('网络异常，请重试。');}
 });}}>
 <div className="form-grid"><label className="field"><span className="field-label">会员昵称</span><input value={name} onChange={e=>setName(e.target.value)} maxLength={40} required placeholder="如：小明" /></label><label className="field"><span className="field-label">默认年级</span><select value={grade} onChange={e=>setGrade(Number(e.target.value))}>{grades.map((g,i)=><option key={g} value={i+1}>{g}</option>)}</select></label></div>
 <label className="member-checkbox"><input type="checkbox" checked={generate} onChange={e=>setGenerate(e.target.checked)}/>自动生成 8 位数字密码{editing?'（重置密码）':''}</label>
 {!generate&&<label className="field"><span className="field-label">{editing?'新密码（留空则保留原密码）':'会员密码'}</span><input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} maxLength={64} required={!editing} placeholder="8～64 位，每个会员的密码必须不同"/></label>}
 {editing&&<label className="member-checkbox"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/>启用会员</label>}
 <p className="muted small">重置密码或停用会员会使其所有设备退出登录，已有学习记录保留。</p>
 <div className="member-form-actions"><button className="button" disabled={pending}>{pending?'正在保存…':editing?'保存会员':'创建会员'}</button>{editing&&<button type="button" className="button secondary" onClick={()=>edit(null)}>取消编辑</button>}</div>
 </form>{error&&<p role="alert" className="notice error">{error}</p>}{message&&<div role="status" className="notice">{message}{shownPassword&&<><p>请保存并交给会员，本次关闭后无法查看原密码。</p><strong className="issued-password">{shownPassword}</strong></>}</div>}</section>
 <section className="panel member-list"><div className="section-heading"><h2>全部会员</h2><span className="small muted">{members.length} 位</span></div><label className="search-box"><input aria-label="搜索会员" placeholder="按昵称搜索会员" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 {members.filter(m=>m.name.includes(search.trim())).map(m=><div className="member-row" key={m.id}><div><strong>{m.name}</strong><p>{grades[m.grade-1]} · {m.active?'已启用':'已停用'}</p></div><button className="button secondary small" onClick={()=>{edit(m);window.scrollTo({top:0,behavior:'smooth'});}}>编辑 / 重置密码</button></div>)}
 {!members.length&&<p className="empty-state">还没有会员，先创建一位吧。</p>}</section></>;
}
