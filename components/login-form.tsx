'use client';
import { useActionState } from 'react';
import { login } from '@/app/admin/actions';
import { Icon } from '@/components/icon';

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return <section className="login-card"><span className="section-icon"><Icon name="lock" size={26} /></span><p className="eyebrow">内容管理</p><h1>管理员登录</h1><p className="lede">管理校服图片、款式介绍与发布状态。</p>
    <form action={action}>
      {state.error && <div className="alert error" role="alert">{state.error}</div>}
      <label className="field"><span className="field-label">邮箱</span><input name="email" type="email" autoComplete="username" required placeholder="请输入管理员邮箱" maxLength={254} /></label>
      <label className="field"><span className="field-label">密码</span><input name="password" type="password" autoComplete="current-password" required placeholder="请输入密码" maxLength={256} /></label>
      <button className="button full-width" disabled={pending}>{pending ? '正在登录…' : '登录后台'}</button>
    </form><p className="login-foot">仅开放给已授权的管理员。<br />忘记密码时，请联系项目所有者重置账号。</p>
  </section>;
}
