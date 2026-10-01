import { z } from 'zod';
import { recordSchema, type Session } from '../progress';
import type { LearningRecord } from '../types';
import type { DailyPlan } from '../recommendations';
export const sessionSchema=z.object({id:z.uuid(),version:z.string().max(60000),index:z.number().int().min(0).max(19),answers:z.array(z.number().int().min(0).max(3)).max(20),seconds:z.number().int().min(0).max(86400),startedAt:z.number().finite().nonnegative().optional()}).refine(s=>s.answers.length>=s.index&&s.answers.length<=s.index+1);
const planSchema=z.object({day:z.iso.date(),grade:z.number().int().min(1).max(6),items:z.array(z.object({lessonId:z.uuid(),subject:z.enum(['math','chinese','english','science']),kind:z.enum(['new','weak','review'])})).max(4)}).refine(p=>new Set(p.items.map(i=>i.subject)).size===p.items.length);
export const operationSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('record'),id:z.uuid(),record:recordSchema}),
 z.object({type:z.literal('session'),id:z.uuid(),lessonId:z.uuid(),session:sessionSchema}),
 z.object({type:z.literal('grade'),id:z.uuid(),grade:z.number().int().min(1).max(6),changedAt:z.number().finite().nonnegative()}),
 z.object({type:z.literal('plan'),id:z.uuid(),plan:planSchema}),
]);
export type ProgressOperation=z.infer<typeof operationSchema>;
export type CloudState={records:LearningRecord[];sessions:Record<string,Session>;grade:number;gradeChangedAt?:number;plans:Record<string,DailyPlan>};
export const emptyState=(grade=2):CloudState=>({records:[],sessions:{},grade,plans:{}});
export function mergeProgress(current:CloudState,operations:ProgressOperation[]):CloudState{
 const next:CloudState={...current,records:[...current.records],sessions:{...current.sessions},plans:{...current.plans}};
 for(const op of operations){
  if(op.type==='record'){
   // A finished attempt is immutable and its UUID is the idempotency key.
   if(!next.records.some(r=>r.id===op.record.id))next.records.push(op.record);
   if(next.sessions[op.record.lessonId]?.id===op.record.id)delete next.sessions[op.record.lessonId];
  }else if(op.type==='session'){
   if(next.records.some(r=>r.id===op.session.id))continue;
   const prev=next.sessions[op.lessonId];
   if(!prev || (prev.id===op.session.id ? op.session.answers.length>prev.answers.length || op.session.answers.length===prev.answers.length&&op.session.index>=prev.index : (op.session.startedAt??0)>(prev.startedAt??0))) next.sessions[op.lessonId]=op.session;
  }else if(op.type==='grade'){
   if(op.changedAt>=(next.gradeChangedAt??0)){next.grade=op.grade;next.gradeChangedAt=op.changedAt;}
  }else{
   const key=`${op.plan.day}:${op.plan.grade}`;
   // First device establishes today's plan. Other devices use those same cards.
   next.plans[key]??=op.plan;
  }
 }
 next.records.sort((a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt)||a.id.localeCompare(b.id));
 next.records=next.records.slice(-500);
 // Retain a bounded set of daily plans for all six grades.
 const keys=Object.keys(next.plans).sort().reverse().slice(0,42);
 next.plans=Object.fromEntries(keys.map(k=>[k,next.plans[k]]));
 return next;
}
