import { test as base, expect, type BrowserContext } from '@playwright/test';
import { memberQuery } from '../../lib/members/database';
import { loadEnvConfig } from '@next/env';
import { randomBytes } from 'node:crypto';
import { hashPassword, passwordLookup } from '../../lib/members/crypto';
loadEnvConfig(process.cwd());
export async function testState(id:string){return (await memberQuery<{state:import('../../lib/members/state').CloudState}>('select state from learning_member_progress where member_id=$1',[id])).rows[0]?.state;}
export async function testMemberId(name:string){return (await memberQuery<{id:string}>('select id from learning_members where name=$1',[name])).rows[0]?.id;}
export async function createTestMember(){
 const password=randomBytes(12).toString('hex');
 const {rows}=await memberQuery<{pepper:string}>('select pepper from learning_member_secrets where id=true');
 await memberQuery('delete from learning_member_login_limits where bucket=$1',[passwordLookup('local',rows[0].pepper)]);
 const name=`会员验证-${randomBytes(6).toString('hex')}`;
 const created=await memberQuery<{id:string}>('select learning_member_manage(null,$1,2,true,$2,$3) as id',[name,await hashPassword(password),passwordLookup(password,rows[0].pepper)]);
 return {id:created.rows[0].id,name,password};
}
export async function loginMember(context:BrowserContext,baseURL:string,password:string){
 const response=await context.request.post(`${baseURL}/api/member/login`,{headers:{Origin:baseURL},data:{password}});expect(response.status()).toBe(200);
}
export async function deleteTestMember(id:string){await memberQuery("delete from learning_members where id=$1 and name like '会员验证-%'",[id]);}
export const test=base.extend<{member:{id:string;name:string;password:string};authenticated:void}>({
 member:async({},use)=>{const member=await createTestMember();try{await use(member);}finally{await deleteTestMember(member.id);}},
 authenticated:[async({context,page,baseURL,member},use)=>{page.on('response',async response=>{if(response.url().includes('/api/member/progress')&&response.status()>=400){const data=await response.json().catch(()=>({}));console.log('Progress response',response.status(),data.error);}});await loginMember(context,baseURL!,member.password);await use();},{auto:true}],
});
export {expect};
