import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyPlan, reconcileDailyPlan, loadDailyPlan, selectDailyRecommendations, clearDailyPlans, DAILY_PLAN_PREFIX } from '../lib/recommendations';
import { setStorageMember, storageKey } from '../lib/members/storage';
import { dayKey } from '../lib/progress';
import type { LessonSummary, LearningRecord, Subject } from '../lib/types';
const now = new Date(2026,8,30,12);
const subjects:Subject[]=['math','chinese','english','science'];
function lesson(n:number,subject:Subject='math',grade=2):LessonSummary {
 return {id:`76000000-0000-4000-8000-${String(n).padStart(12,'0')}`,title:`关卡${n}`,description:'测试关卡',subject,grade,topic:'测试',category:'test',tags:[],minutes:8,status:'published',questionCount:10,created_at:new Date(2026,8,1,n).toISOString(),updated_at:new Date(2026,8,1,n).toISOString()};
}
let serial=0;
function record(l:LessonSummary,correct=9,date=new Date(2026,8,29,10)):LearningRecord {
 return {id:`77000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,lessonId:l.id,title:l.title,grade:l.grade,subject:l.subject,total:10,correct,seconds:60,completedAt:date.toISOString(),wrongIds:Array.from({length:10-correct},(_,i)=>`78000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`)};
}
const bank=Array.from({length:12},(_,i)=>lesson(i+1,subjects[i%4]));
const store=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v),removeItem:(k:string)=>store.delete(k)}});

test('one ten-question lesson per available subject, independent of database row order',()=>{
 const plan=buildDailyPlan(bank,[],2,now);
 assert.equal(plan.items.length,4);assert.ok(plan.items.every(i=>i.kind==='new'));
 assert.deepEqual(plan,buildDailyPlan([...bank].reverse(),[],2,now));
 assert.deepEqual(plan.items.map(i=>i.subject),['chinese','math','english','science']);
 const partial=buildDailyPlan([bank[0],bank[4],{...bank[1],status:'draft'},lesson(20,'english',3),{...bank[3],questionCount:5}],[],2,now);
 assert.deepEqual(partial.items.map(i=>i.subject),['math']);
 assert.deepEqual(buildDailyPlan([],[],2,now).items,[]);
});
test('each subject independently gets weak review after two new completions across days',()=>{
 const math=[lesson(1),lesson(2),lesson(3),lesson(4)],chinese=lesson(5,'chinese');
 const history=[record(math[0],3,new Date(2026,8,26)),record(math[0],4,new Date(2026,8,27)),record(math[1],10,new Date(2026,8,28)),record(math[2],10,new Date(2026,8,29))];
 const plan=buildDailyPlan([...math,chinese],history,2,now);
 assert.deepEqual(plan.items.map(i=>i.kind),['new','weak']);
 assert.equal(plan.items[1].lessonId,math[0].id);
 const beforeTwo=buildDailyPlan([...math,chinese],history.slice(0,3),2,now);
 assert.equal(beforeTwo.items[1].kind,'new');assert.equal(beforeTwo.items[1].lessonId,math[2].id);
});
test('latest score controls weakness at the 80 percent boundary; lowest score wins',()=>{
 const a=lesson(1),b=lesson(2);
 const low=record(a,2,new Date(2026,8,28)),improved=record(a,8);
 assert.equal(buildDailyPlan([a],[improved,low],2,now).items[0].kind,'review');
 assert.deepEqual(buildDailyPlan([a],[improved,low],2,now),buildDailyPlan([a],[low,improved],2,now));
 assert.equal(buildDailyPlan([a,b],[record(a,6),record(b,2)],2,now).items[0].lessonId,b.id);
 assert.equal(buildDailyPlan([a,b],[record(a,9,new Date(2026,8,28)),record(b,10)],2,now).items[0].lessonId,a.id);
});
test('today completion stays on its card; unrelated, mismatched and future attempts do not complete it',()=>{
 const plan=buildDailyPlan(bank,[],2,now);
 const chosen=bank.find(l=>l.id===plan.items[0].lessonId)!;
 const history=[record(chosen,3,new Date(2026,8,30,11))];
 assert.deepEqual(buildDailyPlan(bank,history,2,now),plan);
 const cards=selectDailyRecommendations(plan,bank,history,now);
 assert.equal(cards.length,4);assert.equal(cards[0].completed,true);assert.equal(cards[1].completed,false);
 for(const bad of [record(chosen,9,new Date(2026,9,1)),{...history[0],grade:3},{...history[0],subject:'science' as Subject},record(bank[9],9,new Date(2026,8,30,11))]){
  assert.ok(selectDailyRecommendations(plan,bank,[bad],now).every(c=>!c.completed));
 }
 const all=plan.items.map(i=>record(bank.find(l=>l.id===i.lessonId)!,9,new Date(2026,8,30,11)));
 assert.ok(selectDailyRecommendations(plan,bank,all,now).every(c=>c.completed));
});
test('cached selections survive completion, reload and new content in existing subjects',()=>{
 store.clear();const first=loadDailyPlan(bank,[],2,now);
 const done=record(bank.find(l=>l.id===first.items[0].lessonId)!,3,new Date(2026,8,30,11));
 const added={...lesson(50,'chinese'),created_at:'2020-01-01T00:00:00Z'};
 assert.deepEqual(loadDailyPlan([...bank,added],[done],2,now),first);
 assert.deepEqual(JSON.parse(store.get(`${DAILY_PLAN_PREFIX}2`)!),first);
});
test('withdrawn lessons replace only their subject; new subjects are added and empty ones removed',()=>{
 const cached=buildDailyPlan(bank,[],2,now),first=cached.items[0].lessonId;
 const revised=bank.map(l=>l.id===first?{...l,status:'draft' as const}:l);
 const plan=reconcileDailyPlan(cached,revised,[],2,now);
 assert.notEqual(plan.items[0].lessonId,first);assert.deepEqual(plan.items.slice(1),cached.items.slice(1));
 const partial=buildDailyPlan(bank.filter(l=>l.subject==='math'),[],2,now);
 assert.equal(reconcileDailyPlan(partial,bank,[],2,now).items.length,4);
 assert.deepEqual(reconcileDailyPlan(cached,bank.filter(l=>l.subject==='math'),[],2,now).items.map(i=>i.subject),['math']);
});
test('next local day rebuilds with yesterday results; grade plans remain isolated',()=>{
 const cached=buildDailyPlan(bank,[],2,now);
 const history=cached.items.map(i=>record(bank.find(l=>l.id===i.lessonId)!,9,new Date(2026,8,30,11)));
 const tomorrow=new Date(2026,9,1,0,1);
 const next=reconcileDailyPlan(cached,bank,history,2,tomorrow);
 assert.ok(next.items.every(i=>!cached.items.some(c=>c.lessonId===i.lessonId)));
 assert.deepEqual(selectDailyRecommendations(cached,bank,history,tomorrow),[]);
 const grade3=lesson(31,'math',3);
 assert.deepEqual(reconcileDailyPlan(cached,[...bank,grade3],history,3,now).items.map(i=>i.lessonId),[grade3.id]);
});
test('malformed and duplicate caches recover; reset clears both versions without unrelated data',()=>{
 store.clear();store.set(`${DAILY_PLAN_PREFIX}2`,'broken json');
 const valid=buildDailyPlan(bank,[],2,now);
 assert.deepEqual(loadDailyPlan(bank,[],2,now),valid);
 for(const bad of [{...valid,items:[valid.items[0],valid.items[0]]},{...valid,day:'bad'},{...valid,items:[{lessonId:'bad',kind:'weak'}]}])assert.deepEqual(reconcileDailyPlan(bad,bank,[],2,now),valid);
 store.set('fun-learning:daily-plan:v1:2','old');store.set(`${DAILY_PLAN_PREFIX}3`,'old');store.set('unrelated','keep');
 clearDailyPlans();assert.equal(store.size,1);assert.equal(store.get('unrelated'),'keep');
});
test('blocked storage preserves stable plans with and without in-memory cache',()=>{
 const original=globalThis.localStorage;
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');}}});
 try{
  const first=loadDailyPlan(bank,[],2,now);
  const done=record(bank.find(l=>l.id===first.items[0].lessonId)!,9,new Date(2026,8,30,11));
  assert.deepEqual(loadDailyPlan(bank,[done],2,now,first),first);
  assert.deepEqual(loadDailyPlan(bank,[done],2,now),first);assert.equal(first.day,dayKey(now));
 }finally{Object.defineProperty(globalThis,'localStorage',{configurable:true,value:original});}
});

test('cloud JSONB key order does not trigger a second plan upload',()=>{
 const member='76000000-0000-4000-8000-999999999999';
 const plan=buildDailyPlan(bank,[],2,now);
 const roundTrip={items:plan.items.map(({lessonId,subject,kind})=>({kind,subject,lessonId})),grade:plan.grade,day:plan.day};
 let events=0;
 Object.defineProperty(globalThis,'window',{configurable:true,value:{dispatchEvent:()=>{events++;}}});
 setStorageMember(member);
 try{
  store.set(storageKey(`${DAILY_PLAN_PREFIX}2`),JSON.stringify(roundTrip));
  assert.deepEqual(loadDailyPlan(bank,[],2,now),plan);assert.equal(events,0);
 }finally{setStorageMember(null);Reflect.deleteProperty(globalThis,'window');}
});
