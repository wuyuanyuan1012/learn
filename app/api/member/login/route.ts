import { memberQuery } from '@/lib/members/database';
import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { memberPepper, sameOrigin, MEMBER_COOKIE, LOGIN_DAYS, privateHeaders } from '@/lib/members/server';
import { passwordLookup, tokenHash, verifyPassword } from '@/lib/members/crypto';
export async function POST(request: Request) {
  const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:privateHeaders});
  if(!sameOrigin(request)) return reply('请求来源无效。',403);
  if(Number(request.headers.get('content-length')||0)>2048) return reply('请求过大。',413);
  try {
    const body=await request.text();if(body.length>2048)return reply('请求过大。',413);
    const parsed=z.object({password:z.string().min(8).max(64)}).safeParse(JSON.parse(body));
    if(!parsed.success)return reply('请输入 8～64 位会员密码。',400);
    const pepper=await memberPepper();
    const ip=process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown' : 'local';
    const {rows:limits}=await memberQuery<{allowed:boolean}>('select learning_member_rate_limit($1) as allowed',[passwordLookup(ip,pepper)]);
    if(!limits[0].allowed) return reply('尝试次数过多，请 15 分钟后再试。',429);
    const {rows}=await memberQuery<{id:string;password_hash:string;active:boolean;auth_version:number}>('select id,password_hash,active,auth_version from learning_members where password_lookup=$1',[passwordLookup(parsed.data.password,pepper)]);
    const member=rows[0];
    // Do the same KDF work for unknown passwords to avoid timing-based enumeration.
    const valid=await verifyPassword(parsed.data.password,member?.password_hash || `${'0'.repeat(32)}:${'0'.repeat(128)}`);
    if(!member || !member.active || !valid) return reply('密码不正确或会员已停用，请联系管理员。',401);
    const token=randomBytes(32).toString('hex');
    await memberQuery('insert into learning_member_sessions(token_hash,member_id,auth_version,expires_at) values($1,$2,$3,$4)',[tokenHash(token),member.id,member.auth_version,new Date(Date.now()+LOGIN_DAYS*86400000)]);
    const response=NextResponse.json({ok:true},{headers:privateHeaders});
    response.cookies.set(MEMBER_COOKIE,token,{httpOnly:true,secure:new URL(request.url).protocol==='https:',sameSite:'lax',path:'/',maxAge:LOGIN_DAYS*86400});
    return response;
  } catch { return reply('暂时无法登录，请稍后重试。',503); }
}
