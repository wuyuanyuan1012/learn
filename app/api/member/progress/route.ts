import { z } from 'zod';
import { memberQuery } from '@/lib/members/database';
import { getMember, sameOrigin, privateHeaders } from '@/lib/members/server';
import { mergeProgress, operationSchema, type CloudState } from '@/lib/members/state';
import { getLessons } from '@/lib/catalog';
import { reconcileDailyPlan } from '@/lib/recommendations';
import type { Lesson } from '@/lib/types';
const inputSchema=z.object({memberId:z.uuid(),operations:z.array(operationSchema).max(100)});
export async function POST(request:Request){
 const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:privateHeaders});
 if(!sameOrigin(request))return reply({error:'请求来源无效。'},403);
 if(Number(request.headers.get('content-length')||0)>1000000)return reply({error:'请求过大。'},413);
 try{
  const auth=await getMember();if(!auth)return reply({error:'请重新登录。'},401);
  const body=await request.text();if(body.length>1000000)return reply({error:'请求过大。'},413);
  const parsed=inputSchema.safeParse(JSON.parse(body));if(!parsed.success)return reply({error:'学习记录格式无效。'},400);
  if(parsed.data.memberId!==auth.member.id)return reply({error:'会员已切换，请重新进入学习。'},409);
  const operations=parsed.data.operations;
  if(!operations.length){const {rows}=await memberQuery<{state:CloudState}>('select state from learning_member_progress where member_id=$1',[auth.member.id]);if(!rows[0])throw new Error('MISSING_MEMBER_PROGRESS');return reply({state:rows[0].state});}
  const touchedIds=[...new Set(operations.flatMap(op=>op.type==='record'?[op.record.lessonId]:op.type==='session'?[op.lessonId]:[]))];
  const hasPlan=operations.some(op=>op.type==='plan');
  const {lessons}=await getLessons(hasPlan?undefined:touchedIds);
  const byId=new Map(lessons.map(l=>[l.id,l]));
  // Ignore stale offline data for unavailable content, without blocking other records.
  const valid=operations.filter(op=>{
   if(op.type==='record')return true; // Preserve history even after a lesson is withdrawn.
   if(op.type==='session')return byId.has(op.lessonId);
   return true;
  });
  const ids=[...new Set(valid.flatMap(op=>op.type==='session'?[op.lessonId]:[]))];
  const fullLessons=new Map<string,Lesson>();
  if(ids.length){const {rows}=await memberQuery<Lesson>('select *,created_at::text,updated_at::text from learning_lessons where id=any($1::uuid[])',[ids]);for(const l of rows)fullLessons.set(l.id,l);}
  const clean=valid.filter(op=>{
   if(op.type!=='session')return true;
   const l=fullLessons.get(op.lessonId)!;
   let version:unknown;try{version=JSON.parse(op.session.version);}catch{return false;}
   return Array.isArray(version)&&Date.parse(String(version[0]))===Date.parse(l.updated_at)&&JSON.stringify(version[1])===JSON.stringify(l.questions)&&op.session.index<l.questions.length;
  }).map(op=>{
   if(op.type==='record'){
    const l=byId.get(op.record.lessonId);
    return {...op,record:{...op.record,...(l?{title:l.title,subject:l.subject,grade:l.grade}:{}),completedAt:new Date(Math.min(Date.now(),Date.parse(op.record.completedAt))).toISOString()}};
   }
   if(op.type==='grade')return {...op,changedAt:Math.min(op.changedAt,Date.now())};
   if(op.type==='session')return {...op,session:{...op.session,startedAt:Math.min(op.session.startedAt??Date.now(),Date.now())}};
   return op;
  });
  for(let attempt=0;attempt<6;attempt++){
   const {rows}=await memberQuery<{revision:string;state:CloudState}>('select revision,state from learning_member_progress where member_id=$1',[auth.member.id]);const data=rows[0];if(!data)throw new Error('MISSING_MEMBER_PROGRESS');
   const state=mergeProgress(data.state as CloudState,clean);
   // Reconcile withdrawn lessons without replacing valid same-day assignments.
   for(const [key,plan] of hasPlan?Object.entries(state.plans):[]){
    const date=new Date(`${plan.day}T12:00:00`);
    state.plans[key]=reconcileDailyPlan(plan,lessons,state.records,plan.grade,date);
   }
   if(!clean.length && JSON.stringify(state)===JSON.stringify(data.state))return reply({state});
   let saved=false;
   try { const {rows}=await memberQuery<{saved:boolean}>('select learning_member_commit($1,$2,$3,$4) as saved',[auth.hash,auth.member.id,data.revision,state]);saved=rows[0].saved; }
   catch(error){if(error instanceof Error&&error.message.includes('MEMBER_UNAUTHORIZED'))return reply({error:'请重新登录。'},401);throw error;}
   if(saved)return reply({state});
  }
  return reply({error:'同步繁忙，正在重试。'},503);
 }catch{return reply({error:'学习进度暂未同步，请稍后重试。'},503);}
}
