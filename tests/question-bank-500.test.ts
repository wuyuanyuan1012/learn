import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questionBank500, normalizePrompt } from '../content/question-bank-500';
import { seedLessons } from '../lib/seed';
import { lessonSchema } from '../lib/validation';

test('batch has exactly 100 validated lessons, 500 distinct questions, balanced answer positions and all six grades',()=>{
 assert.equal(questionBank500.length,100);
 const questions=questionBank500.flatMap(l=>l.questions);
 assert.equal(questions.length,500);
 for(const lesson of questionBank500){assert.equal(lesson.questions.length,5);assert.equal(lessonSchema.safeParse(lesson).success,true);}
 assert.equal(new Set(questions.map(q=>q.id)).size,500);
 assert.equal(new Set(questions.map(q=>normalizePrompt(q.prompt))).size,500);
 assert.deepEqual([0,1,2,3].map(index=>questions.filter(q=>q.answer===index).length),[125,125,125,125]);
 assert.deepEqual([...new Set(questionBank500.map(l=>l.grade))].sort(),[1,2,3,4,5,6]);
 assert.deepEqual(Object.fromEntries(['math','chinese','english','science'].map(s=>[s,questionBank500.filter(l=>l.subject===s).length*5])),{math:200,chinese:100,english:100,science:100});
 const existing=new Set(seedLessons.flatMap(l=>l.questions.map(q=>normalizePrompt(q.prompt))));
 for(const q of questions)assert.equal(existing.has(normalizePrompt(q.prompt)),false,q.prompt);
});
// Independent rational evaluator for the explicitly written arithmetic questions.
type Rational=[bigint,bigint];
function rational(raw:string):Rational {
 if(raw.includes('/')){const[a,b]=raw.split('/');return [BigInt(a),BigInt(b)];}
 const [whole,decimal='']=raw.split('.');return [BigInt(whole+decimal),BigInt(10)**BigInt(decimal.length)];
}
function apply(a:Rational,b:Rational,op:string):Rational{
 const[x,y]=a,[u,v]=b;
 if(op==='+')return[x*v+u*y,y*v];
 if(op==='−')return[x*v-u*y,y*v];
 if(op==='×')return[x*u,y*v];
 return[x*v,y*u];
}
function same(a:Rational,b:Rational){return a[0]*b[1]===b[0]*a[1];}
test('every explicitly written arithmetic expression has the exact correct answer',()=>{
 let checked=0;
 for(const l of questionBank500.filter(l=>l.subject==='math'))for(const q of l.questions){
  const answer=q.options[q.answer];
  let expected:Rational|undefined;
  let match=q.prompt.match(/^计算 ([\d.]+) ([+−×÷]) ([\d.]+)，/);
  if(match)expected=apply(rational(match[1]),rational(match[3]),match[2]);
  match=q.prompt.match(/^算式 ([\d.]+) \+ ([\d.]+) × ([\d.]+) 的/);
  if(match)expected=apply(rational(match[1]),apply(rational(match[2]),rational(match[3]),'×'),'+');
  match=q.prompt.match(/^巧算 ([\d.]+) × ([\d.]+) × ([\d.]+)，/);
  if(match)expected=apply(apply(rational(match[1]),rational(match[2]),'×'),rational(match[3]),'×');
  match=q.prompt.match(/^(\d+\/\d+) ([+−×]) (\d+(?:\/\d+)?) /);
  if(match)expected=apply(rational(match[1]),rational(match[3]),match[2]);
  if(expected){assert.ok(same(expected,rational(answer)),`${q.prompt} answer=${answer}`);checked++;}
 }
 assert.equal(checked,90);
});
test('units, geometry, averages and proportional reasoning use correct numeric answers',()=>{
 let checked=0;
 for(const lesson of questionBank500.filter(l=>l.subject==='math'))for(const q of lesson.questions){
  const nums=q.prompt.match(/\d+(?:\.\d+)?/g)?.map(Number)??[];
  let expected:number|undefined;
  switch(lesson.topic){
   case '长度单位换算':expected=nums[0]*100;break;
   case '元角换算':expected=nums[0]*10+nums[1];break;
   case '两步加减应用':expected=nums[0]-nums[1]+nums[2];break;
   case '有余数的除法':expected=nums[0]%nums[1];break;
   case '长方形周长':expected=2*(nums[0]+nums[1]);break;
   case '千克与克':expected=nums[0]*1000;break;
   case '大数单位':expected=nums[0]*10000;break;
   case '长方形面积':expected=nums[0]*nums[1];break;
   case '时分换算':expected=nums[0]*60+nums[1];break;
   case '长方体体积':expected=nums[0]*nums[1]*nums[2];break;
   case '平均数':expected=(nums[0]+nums[1]+nums[2])/3;break;
   case '小数与百分数':expected=nums[0]*100;break;
   case '求一个数的百分之几':expected=nums[0]*nums[1]/100;break;
   case '比的应用':expected=nums[2]/nums[0]*nums[1];break;
   case '圆的面积':expected=nums[0]**2*3.14;break;
   case '比例尺':expected=nums[1]*nums[2]/100;break;
  }
  if(expected!==undefined){const actual=parseFloat(q.options[q.answer]);assert.ok(Math.abs(actual-expected)<1e-8,q.prompt);checked++;}
 }
 assert.equal(checked,80);
});
