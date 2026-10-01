import { test, expect } from './member-fixture';
import { expandedLessons } from '../../content/ten-question-lessons';
import { DAILY_PLAN_PREFIX } from '../../lib/recommendations';
import type { Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
function contextRequest(page:Page,baseURL:string,memberId:string,records:LearningRecord[]){return page.request.post(`${baseURL}/api/member/progress`,{headers:{Origin:baseURL},data:{memberId,operations:records.map(record=>({type:'record',id:randomUUID(),record}))}});}
import type { LearningRecord, Lesson } from '../../lib/types';

test.use({ timezoneId: 'Asia/Shanghai' });
const fixedNow=new Date('2026-09-30T04:00:00.000Z');
let serial=0;
function makeRecord(l:Lesson,correct:number,date:string):LearningRecord {
 return {id:`79000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,lessonId:l.id,title:l.title,grade:l.grade,subject:l.subject,correct,total:10,seconds:80,completedAt:date,wrongIds:l.questions.slice(correct).map(q=>q.id)};
}
test('daily recommendation shows all subjects, persists after completion and reload, and handles grade changes',async({page,member,baseURL})=>{
 await page.clock.setFixedTime(fixedNow);
 await page.goto('/');
 const cards=page.locator('.subject-challenge');
 await expect(cards).toHaveCount(4);
 for(const subject of ['语文','数学','英语','科学']){
  const card=page.getByRole('region',{name:`${subject}今日挑战`,exact:true});
  await expect(card).toBeVisible();await expect(card.getByText('10 道题',{exact:true})).toBeVisible();
 }
 const links=await cards.getByRole('link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 await page.reload();await expect(cards).toHaveCount(4);
 expect(await cards.getByRole('link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')))).toEqual(links);
 await page.getByLabel('学习年级').selectOption('1');
 await expect(cards).toHaveCount(new Set(expandedLessons.filter(l=>l.grade===1).map(l=>l.subject)).size);
 await expect(cards.first()).toContainText('一年级');
 await page.getByLabel('学习年级').selectOption('2');await expect(cards).toHaveCount(4);
 expect(await cards.getByRole('link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')))).toEqual(links);
 const lesson=expandedLessons.find(l=>`/learn/${l.id}`===links[0])!;
 // Exercise a real ten-question completion and navigation back to today's cards.
 await cards.first().getByRole('link',{name:'开始挑战'}).click();
 for(const [i,q] of lesson.questions.entries()){
  await page.getByRole('button',{name:`${String.fromCharCode(65+q.answer)} ${q.options[q.answer]}`,exact:true}).click();
  await page.getByRole('button',{name:'确认答案'}).click();
  await page.getByRole('button',{name:i===9?'看看学习成果':'下一题'}).click();
 }
 await page.getByRole('link',{name:'回到今日挑战'}).click();
 await expect(cards.first().getByText('已完成',{exact:true})).toBeVisible();
 await expect(cards.first().getByRole('link',{name:'再练一次'})).toHaveAttribute('href',links[0]!);
 await expect(page.getByRole('region',{name:'今日学习情况'})).toContainText('已完成 1 / 4 科');
 await page.reload();await expect(cards.first().getByText('已完成',{exact:true})).toBeVisible();
 expect(await cards.getByRole('link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')))).toEqual(links);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/recommendation-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1100});await page.screenshot({path:'test-results/recommendation-desktop.png',fullPage:true});
 await page.goto('/progress');await expect(page.getByText('多端同步',{exact:true})).toBeVisible();
});
test('all done today retains four completed cards and next local day resets assignments',async({page,member,baseURL})=>{
 await page.clock.setFixedTime(fixedNow);await page.goto('/');
 const cards=page.locator('.subject-challenge');await expect(cards).toHaveCount(4);
 const links=await cards.getByRole('link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 const records=links.map(href=>makeRecord(expandedLessons.find(l=>`/learn/${l.id}`===href)!,10,'2026-09-30T02:00:00.000Z'));
 const response=await contextRequest(page,baseURL!,member.id,records);expect(response.ok()).toBe(true);await page.bringToFront();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.getByRole('heading',{name:'今日挑战全部完成啦'})).toBeVisible();
 await expect(cards).toHaveCount(4);await expect(cards.getByRole('link',{name:'再练一次'})).toHaveCount(4);
 await expect(page.getByRole('link',{name:'开始挑战'})).toHaveCount(0);
 await page.clock.setFixedTime(new Date('2026-09-30T16:01:00.000Z'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(cards.getByRole('link',{name:'开始挑战'})).toHaveCount(4);
 await expect(page.getByRole('region',{name:'今日学习情况'})).toContainText('已完成 0 / 4 科');
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).day,`fun-learning:member:${member.id}:${DAILY_PLAN_PREFIX}2`)).toBe('2026-10-01');
 const next=await cards.getByRole('link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 for(const [i,href] of next.entries()){
  const lesson=expandedLessons.find(l=>`/learn/${l.id}`===href)!;
  const available=expandedLessons.filter(l=>l.grade===2&&l.subject===lesson.subject);
  if(available.length>1) expect(href).not.toBe(links[i]);
  else { expect(href).toBe(links[i]);await expect(cards.nth(i)).toContainText('温故知新，让记忆更牢固'); }
 }
});
test('completion from another tab marks the same card complete without replacing other subjects',async({page,context,member,baseURL})=>{
 await page.clock.setFixedTime(fixedNow);await page.goto('/');
 const cards=page.locator('.subject-challenge');await expect(cards).toHaveCount(4);
 const links=await cards.getByRole('link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 const r=makeRecord(expandedLessons.find(l=>`/learn/${l.id}`===links[0])!,9,'2026-09-30T03:00:00.000Z');
 const other=await context.newPage();
 try{
  await other.goto('/practice');
  const response=await contextRequest(other,baseURL!,member.id,[r]);expect(response.ok()).toBe(true);await page.bringToFront();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(cards.first().getByText('已完成',{exact:true})).toBeVisible();
  expect(await cards.getByRole('link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')))).toEqual(links);
  await expect(cards.getByRole('link',{name:'开始挑战'})).toHaveCount(3);
 }finally{await other.close();}
});
