'use client';
import { useState } from 'react';
import Link from 'next/link';
export function MemberLoginForm(){
 const [error,setError]=useState(''),[pending,setPending]=useState(false);
 return <main className="container"><section className="panel login-card"><p className="eyebrow">趣味学习</p><h1>开始今天的学习</h1><p className="lede">输入管理员为你分配的会员密码。</p><form onSubmit={async e=>{
  e.preventDefault();setPending(true);setError('');const form=new FormData(e.currentTarget);
  try{const response=await fetch('/api/member/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:form.get('password')})});const data=await response.json();if(!response.ok)throw new Error(data.error);window.location.assign('/');}
  catch(e){setError(e instanceof Error?e.message:'登录失败，请重试。');setPending(false);}
 }}><label className="field"><span className="field-label">会员密码</span><input name="password" type="password" autoComplete="current-password" minLength={8} maxLength={64} required autoFocus /></label>{error&&<p className="notice error" role="alert">{error}</p>}<button disabled={pending} className="button full-width">{pending?'正在登录…':'进入学习'}</button></form><p className="member-login-note">登录后记住 30 天，学习进度会在你的设备间同步。忘记密码请联系管理员。</p><Link className="text-link" href="/admin">管理后台 →</Link></section></main>;
}
