import 'server-only';
import { cache } from 'react';
import { memberQuery } from './database';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { tokenHash } from './crypto';
export const MEMBER_COOKIE = 'fun_learning_member';
export const LOGIN_DAYS = 30;
export type Member = { id: string; name: string; grade: number };
export async function memberPepper() {
  const {rows}=await memberQuery<{pepper:string}>('select pepper from learning_member_secrets where id=true');
  if(!rows[0])throw new Error('会员服务暂不可用。');return rows[0].pepper;
}
export const getMember=cache(async function getMember() {
  const token=(await cookies()).get(MEMBER_COOKIE)?.value;
  if(!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const hash=tokenHash(token);
  const {rows}=await memberQuery<Member>(`select m.id,m.name,m.grade from learning_members m join learning_member_sessions s on s.member_id=m.id
    where s.token_hash=$1 and s.expires_at>now() and m.active and m.auth_version=s.auth_version`,[hash]);
  return rows[0]?{member:rows[0],hash}:null;
});
export async function requireMember() {
  const result=await getMember();if(!result) redirect('/member-login');return result;
}
export function sameOrigin(request: Request) {
  const origin=request.headers.get('origin');
  if(!origin || request.headers.get('sec-fetch-site')==='cross-site')return false;
  try { const parsed=new URL(origin);return ['http:','https:'].includes(parsed.protocol) && parsed.host===(request.headers.get('host') || new URL(request.url).host); } catch { return false; }
}
export const privateHeaders={'Cache-Control':'private, no-store'};
