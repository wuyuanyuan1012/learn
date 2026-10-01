import { GRADE_KEY, RECORDS_KEY, RECORDS_CHANGED_EVENT, sessionKey } from '../progress';
import { DAILY_PLAN_PREFIX } from '../recommendations';
import { emptyState, mergeProgress, operationSchema, type CloudState, type ProgressOperation } from './state';
import { readStorage, writeStorage, removeStorage, setStorageMember, CLOUD_UPDATED_EVENT } from './storage';
let activeMember='';
let cloud=emptyState();
const pending=new Map<string,ProgressOperation>();
let flight:Promise<void>|null=null;
let statusListener:(status:string)=>void=()=>{};
const outboxPrefix=(member:string)=>`fun-learning:member:${member}:outbox:`;
export function beginMember(id:string,grade:number,onStatus:(status:string)=>void){
 activeMember=id;setStorageMember(id);cloud=emptyState(grade);pending.clear();statusListener=onStatus;
 loadPending();
}
function loadPending(){
 try{
  const prefix=outboxPrefix(activeMember);
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);if(!key?.startsWith(prefix))continue;
   try{const op=operationSchema.safeParse(JSON.parse(localStorage.getItem(key)!));if(op.success)pending.set(op.data.id,op.data);}catch{/* corrupt cache */}
  }
 }catch{/* use in-memory outbox */}
}
function publish(state:CloudState){
 const previous=cloud;cloud=state;
 const put=(key:string,value:string)=>{try{writeStorage(key,value);}catch{/* memory cache is retained */}};
 put(RECORDS_KEY,JSON.stringify(state.records));put(GRADE_KEY,String(state.grade));
 for(const id of Object.keys(previous.sessions))if(!state.sessions[id])try{removeStorage(sessionKey(id));}catch{/* optional cache */}
 for(const record of state.records){
  try{const cached=JSON.parse(readStorage(sessionKey(record.lessonId))||'null');if(cached?.id===record.id)removeStorage(sessionKey(record.lessonId));}catch{/* invalid cache */}
 }
 for(const [id,session] of Object.entries(state.sessions))put(sessionKey(id),JSON.stringify(session));
 for(const plan of Object.values(state.plans).sort((a,b)=>a.day.localeCompare(b.day)))put(`${DAILY_PLAN_PREFIX}${plan.grade}`,JSON.stringify(plan));
 window.dispatchEvent(new Event(RECORDS_CHANGED_EVENT));window.dispatchEvent(new Event(CLOUD_UPDATED_EVENT));
}
export function queueOperation(input:unknown){
 const parsed=operationSchema.safeParse(input);if(!parsed.success)return;
 const op=parsed.data;pending.set(op.id,op);
 try{localStorage.setItem(outboxPrefix(activeMember)+op.id,JSON.stringify(op));}catch{statusListener('浏览器存储不可用，请保持页面打开直到同步完成');}
 publish(mergeProgress(cloud,[...pending.values()]));
 void syncMember();
}
export async function syncMember():Promise<void>{
 if(flight)return flight.catch(()=>{});
 const member=activeMember;
 flight=(async()=>{
  let succeeded=false;
  loadPending();const batch=[...pending.values()].slice(0,100);statusListener('正在同步学习进度…');
  try{
   const response=await fetch('/api/member/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({memberId:member,operations:batch}),cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(response.status===401||response.status===409){window.location.assign('/member-login');return;}
   const data=await response.json();if(!response.ok)throw new Error(data.error);
   if(activeMember!==member)return;
   for(const op of batch){pending.delete(op.id);try{localStorage.removeItem(outboxPrefix(member)+op.id);}catch{/* memory outbox */}}
   // Re-read other tabs' new operations before publishing the returned snapshot.
   loadPending();publish(mergeProgress(data.state,[...pending.values()]));
   succeeded=true;statusListener(pending.size?'正在同步学习进度…':'学习进度已同步');
  }catch{statusListener('暂未同步，联网后自动重试');throw new Error('SYNC_FAILED');}
  finally{if(succeeded&&pending.size)setTimeout(()=>{void syncMember();},0);}
 })().finally(()=>{flight=null;});
 try{await flight;}catch{/* keep durable outbox for next focus/online/retry */}
}
export function hasPending(){return pending.size>0;}
