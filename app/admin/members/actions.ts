'use server';
import { memberQuery } from '@/lib/members/database';
import { randomInt } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAdmin } from '@/lib/auth';
import { memberPepper } from '@/lib/members/server';
import { hashPassword, passwordLookup } from '@/lib/members/crypto';
const schema=z.object({id:z.uuid().optional(),name:z.string().trim().min(1,'请填写会员昵称。').max(40),grade:z.number().int().min(1).max(6),active:z.boolean(),password:z.string().min(8,'密码至少 8 位。').max(64).regex(/^[\x21-\x7e]+$/,'密码请使用数字、字母或符号，不含空格。').optional(),generate:z.boolean().optional()});
export async function saveMember(input:unknown):Promise<{ok:boolean;error?:string;password?:string}>{
 if(!await getAdmin())return {ok:false,error:'登录已过期或无管理权限。'};
 const parsed=schema.safeParse(input);if(!parsed.success)return {ok:false,error:parsed.error.issues[0]?.message||'会员信息无效。'};
 const value=parsed.data;
 if(!value.id&&!value.password&&!value.generate)return {ok:false,error:'请设置会员密码。'};
 try{
  const password=value.generate?String(randomInt(10000000,100000000)):value.password;
  const hash=password?await hashPassword(password):null;
  const lookup=password?passwordLookup(password,await memberPepper()):null;
  try{await memberQuery('select learning_member_manage($1,$2,$3,$4,$5,$6)',[value.id??null,value.name,value.grade,value.active,hash,lookup]);}
  catch(error){return {ok:false,error:(error as {code?:string}).code==='23505'?'这个密码已被其他会员使用，请换一个。':'保存失败，请稍后重试。'};}
  revalidatePath('/admin/members');return {ok:true,...(password?{password}:{})};
 }catch{return {ok:false,error:'保存失败，请检查会员服务配置。'};}
}
