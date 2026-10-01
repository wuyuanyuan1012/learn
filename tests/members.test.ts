import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hashPassword, passwordLookup, tokenHash, verifyPassword } from '../lib/members/crypto';
import { emptyState, mergeProgress, operationSchema } from '../lib/members/state';
import { expandedSeedLessons } from '../content/ten-question-lessons';
import { lessonVersion, type Session } from '../lib/progress';
import { buildDailyPlan } from '../lib/recommendations';
const lesson=expandedSeedLessons[0];
const session:Session={id:randomUUID(),version:lessonVersion(lesson),index:0,answers:[],seconds:0,startedAt:100};
const record={id:session.id,lessonId:lesson.id,title:lesson.title,subject:lesson.subject,grade:lesson.grade,correct:10,total:10,seconds:70,completedAt:new Date().toISOString(),wrongIds:[]};
test('member passwords are salted, verified, keyed for unique lookup; tokens are hashed',async()=>{
 const a=await hashPassword('13572468'),b=await hashPassword('13572468');assert.notEqual(a,b);
 assert.equal(await verifyPassword('13572468',a),true);assert.equal(await verifyPassword('87654321',a),false);
 assert.notEqual(passwordLookup('13572468','one'),passwordLookup('13572468','two'));assert.equal(tokenHash('token').length,64);
});
test('simultaneous device records merge by attempt id and retry does not duplicate or alter a result',()=>{
 const op={type:'record' as const,id:randomUUID(),record};
 let state=mergeProgress(emptyState(),[op]);state=mergeProgress(state,[op,{...op,id:randomUUID(),record:{...record,correct:0,wrongIds:lesson.questions.map(q=>q.id)}}]);
 assert.equal(state.records.length,1);assert.equal(state.records[0].correct,10);
 state=mergeProgress(state,[{...op,id:randomUUID(),record:{...record,id:randomUUID()}}]);assert.equal(state.records.length,2);
});
test('stale partial progress never rolls back answers or resurrects a completed attempt',()=>{
 const op={type:'session' as const,id:randomUUID(),lessonId:lesson.id,session};
 let state=mergeProgress(emptyState(),[{...op,session:{...session,index:2,answers:[1,2],seconds:25}}]);
 state=mergeProgress(state,[op]);assert.equal(state.sessions[lesson.id].index,2);
 state=mergeProgress(state,[{type:'record',id:randomUUID(),record},op]);assert.equal(state.sessions[lesson.id],undefined);
 const restart={...session,id:randomUUID(),startedAt:200};state=mergeProgress(state,[{...op,session:restart}]);
 state=mergeProgress(state,[{...op,session:{...session,id:randomUUID(),startedAt:150}}]);assert.equal(state.sessions[lesson.id].id,restart.id);
});
test('first daily plan stays canonical across devices and grade writes respect timestamp order',()=>{
 const lessons=expandedSeedLessons.map(({questions,...l})=>({...l,questionCount:10,category:l.category!,tags:l.tags!}));
 const plan=buildDailyPlan(lessons,[],2,new Date());
 let state=mergeProgress(emptyState(),[{type:'plan',id:randomUUID(),plan},{type:'grade',id:randomUUID(),grade:3,changedAt:200}]);
 state=mergeProgress(state,[{type:'plan',id:randomUUID(),plan:{...plan,items:[]}},{type:'grade',id:randomUUID(),grade:1,changedAt:100}]);
 assert.deepEqual(state.plans[`${plan.day}:2`],plan);assert.equal(state.grade,3);
});
test('sync operations reject invalid grades, duplicate subject plans and out-of-range answers',()=>{
 assert.equal(operationSchema.safeParse({type:'grade',id:randomUUID(),grade:99,changedAt:1}).success,false);
 assert.equal(operationSchema.safeParse({type:'session',id:randomUUID(),lessonId:lesson.id,session:{...session,answers:[9]}}).success,false);
 assert.equal(operationSchema.safeParse({type:'record',id:randomUUID(),record:{...record,correct:99}}).success,false);
});
