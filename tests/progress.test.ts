import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, lessonVersion, readRecords, readSession, RECORDS_KEY, saveRecord, sessionKey, weekDays } from '../lib/progress';
import { seedLessons } from '../lib/seed';
import type { LearningRecord } from '../lib/types';
const store = new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{ configurable:true, value:{getItem:(key:string)=>store.get(key)??null,setItem:(key:string,value:string)=>store.set(key,value),removeItem:(key:string)=>store.delete(key)} });
const record: LearningRecord = {id:'50000000-0000-4000-8000-000000000001',lessonId:seedLessons[0].id,title:'测试',subject:'math',grade:2,correct:4,total:5,seconds:30,completedAt:'2026-09-30T00:00:00.000Z',wrongIds:[seedLessons[0].questions[0].id]};
test('records survive reload and finishing the same session is idempotent', () => {
  store.clear(); assert.equal(saveRecord(record),true); assert.equal(saveRecord(record),true);
  assert.equal(readRecords().length,1); assert.equal(readRecords()[0].correct,4);
  store.set(RECORDS_KEY,JSON.stringify([record,{...record,correct:99}]));assert.equal(readRecords().length,1);
  store.set(RECORDS_KEY,'broken json');assert.deepEqual(readRecords(),[]);
});
test('session restore rejects edited lessons, out-of-range answers and corrupt position', () => {
  const lesson=seedLessons[0],key=sessionKey(lesson.id);
  const session={id:record.id,version:lessonVersion(lesson),index:1,answers:[2],seconds:20};
  store.set(key,JSON.stringify(session));assert.deepEqual(readSession(lesson),session);
  assert.equal(readSession({...lesson,questions:lesson.questions.slice(1)}),null);
  for(const change of [{index:5},{index:2},{answers:[4]},{seconds:-1},{version:'old'}]) {
    store.set(key,JSON.stringify({...session,...change}));assert.equal(readSession(lesson),null);
  }
});
test('weekly progress uses local Monday through Sunday and handles month boundaries', () => {
  assert.deepEqual(weekDays(new Date(2026,8,30)),['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04']);
  assert.equal(weekDays(new Date(2026,9,4))[0],'2026-09-28');
  assert.equal(dayKey(new Date(2026,0,1)),'2026-01-01');
});
