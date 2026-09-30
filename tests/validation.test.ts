import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessonSchema } from '../lib/validation';
import { seedLessons } from '../lib/seed';

test('all 45 seed questions are valid with complete explanations and distinct choices', () => {
  assert.equal(seedLessons.length,9);
  assert.equal(seedLessons.reduce((n,l) => n+l.questions.length,0),45);
  for (const lesson of seedLessons) assert.equal(lessonSchema.safeParse(lesson).success,true,lesson.title);
});
test('reject invalid grades, states, empty lessons and duplicate questions', () => {
  const lesson = seedLessons[0];
  for(const change of [{title:' '},{description:''},{subject:'unknown'},{grade:0},{grade:7},{grade:1.5},{status:'private'},{minutes:0},{questions:[]},{questions:[lesson.questions[0],lesson.questions[0]]}]) {
    assert.equal(lessonSchema.safeParse({...lesson,...change}).success,false,JSON.stringify(change));
  }
});
test('question validation prevents ambiguous choices and missing feedback', () => {
  const lesson=seedLessons[0],q=lesson.questions[0];
  for(const change of [{prompt:''},{answer:-1},{answer:4},{answer:1.5},{hint:''},{explanation:''},{options:['a','a','b','c']},{options:['a','b','c',' c ']},{options:['a','b']},{options:['a','b','c','']}]) {
    assert.equal(lessonSchema.safeParse({...lesson,questions:[{...q,...change}]}).success,false);
  }
  assert.equal(lessonSchema.parse({...lesson,title:' 测试 '}).title,'测试');
});
