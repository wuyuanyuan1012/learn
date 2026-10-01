'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { beginMember, queueOperation, syncMember, hasPending } from '@/lib/members/client';
import { CLOUD_OPERATION_EVENT } from '@/lib/members/storage';
import type { Member } from '@/lib/members/server';
const MemberContext=createContext<Member|null>(null);
export const useMember=()=>useContext(MemberContext);
export function MemberProvider({member,children}:{member:Member;children:React.ReactNode}){
 const [ready,setReady]=useState(false),[status,setStatus]=useState('正在同步学习进度…'),[leaving,setLeaving]=useState(false);
 useEffect(()=>{
  let alive=true;beginMember(member.id,member.grade,message=>{if(alive)setStatus(message);});
  const operation=(event:Event)=>queueOperation((event as CustomEvent).detail);
  const sync=()=>{if(document.visibilityState==='visible')void syncMember();};
  const storage=(e:StorageEvent)=>{if(e.key==='fun-learning:member-logout')window.location.assign('/member-login');else if(e.key?.startsWith(`fun-learning:member:${member.id}:outbox:`))sync();};
  window.addEventListener(CLOUD_OPERATION_EVENT,operation);
  window.addEventListener('focus',sync);window.addEventListener('online',sync);window.addEventListener('storage',storage);document.addEventListener('visibilitychange',sync);
  void syncMember().then(()=>{if(alive)setReady(true);});
  const timer=setInterval(sync,10000);
  return ()=>{alive=false;clearInterval(timer);window.removeEventListener(CLOUD_OPERATION_EVENT,operation);window.removeEventListener('focus',sync);window.removeEventListener('online',sync);window.removeEventListener('storage',storage);document.removeEventListener('visibilitychange',sync);};
 },[member.id,member.grade]);
 async function logout(){
  setLeaving(true);await syncMember();
  if(hasPending()){setStatus('还有进度未同步，请联网同步后再退出。');setLeaving(false);return;}
  try{const response=await fetch('/api/member/logout',{method:'POST'});if(!response.ok)throw new Error();try{localStorage.setItem('fun-learning:member-logout',String(Date.now()));}catch{/* optional notification */}window.location.assign('/member-login');}
  catch{setStatus('退出失败，请重试。');setLeaving(false);}
 }
 return <MemberContext.Provider value={member}><div className="member-bar container"><span><strong>{member.name}</strong><span role="status">{status}</span></span><button className="text-button" disabled={leaving} onClick={logout}>{leaving?'正在退出…':'退出会员'}</button></div>{ready?children:<main className="empty-state" role="status">正在读取你的学习进度…</main>}</MemberContext.Provider>;
}
