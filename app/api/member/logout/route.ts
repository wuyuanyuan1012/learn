import { memberQuery } from '@/lib/members/database';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { MEMBER_COOKIE, sameOrigin, privateHeaders } from '@/lib/members/server';
import { tokenHash } from '@/lib/members/crypto';
export async function POST(request:Request){
  if(!sameOrigin(request))return NextResponse.json({error:'请求来源无效。'},{status:403,headers:privateHeaders});
  try{
    const token=(await cookies()).get(MEMBER_COOKIE)?.value;
    if(token)await memberQuery('delete from learning_member_sessions where token_hash=$1',[tokenHash(token)]);
    const response=NextResponse.json({ok:true},{headers:privateHeaders});
    response.cookies.set(MEMBER_COOKIE,'',{httpOnly:true,sameSite:'lax',secure:new URL(request.url).protocol==='https:',path:'/',maxAge:0});return response;
  }catch{return NextResponse.json({error:'退出失败，请重试。'},{status:503,headers:privateHeaders});}
}
