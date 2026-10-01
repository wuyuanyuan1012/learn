import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expandedLessons, originalLessons, expandedSeedLessons } from '../content/ten-question-lessons';
import { normalizePrompt } from '../content/question-bank-500';
import { lessonWriteSchema } from '../lib/validation';

test('all 121 lessons contain 10 valid questions while preserving every original question',()=>{
 assert.equal(expandedLessons.length,121);
 assert.equal(expandedLessons.reduce((n,l)=>n+l.questions.length,0),1210);
 assert.equal(expandedSeedLessons.reduce((n,l)=>n+l.questions.length,0),90);
 const ids=new Set<string>(),prompts=new Set<string>();
 expandedLessons.forEach((l,i)=>{
  assert.equal(l.id,originalLessons[i].id);assert.equal(l.questions.length,10);lessonWriteSchema.parse(l);
  assert.deepEqual(l.questions.slice(0,5),originalLessons[i].questions);
  assert.doesNotMatch(l.description,/(^|[^0-9])5道/);
  for(const q of l.questions){assert.ok(!ids.has(q.id));ids.add(q.id);const key=normalizePrompt(q.prompt);assert.ok(!prompts.has(key));prompts.add(key);}
 });
});
function numeric(s:string){if(s.includes('/')){const [a,b]=s.split('/').map(Number);return a/b;}return parseFloat(s);}
test('independent calculation verifies all 210 numerical math additions, including fractions and units',()=>{
 let checked=0;
 for(const l of expandedLessons.filter(l=>l.subject==='math'))for(const q of l.questions.slice(5)){
  const nums=q.prompt.match(/\d+(?:\.\d+)?/g)?.map(Number)??[];
  let expected:number|undefined;
  const expr=q.prompt.match(/^请算一算：([\d.]+) ([+−×÷]) ([\d.]+)/);
  if(expr){const a=Number(expr[1]),b=Number(expr[3]);expected=expr[2]==='+'?a+b:expr[2]==='−'?a-b:expr[2]==='×'?a*b:a/b;}
  else switch(l.topic){
   case '数的顺序':expected=nums[0]-1;break;
   case '加法应用题':case '生活中的加减法':case '10以内加减法':expected=nums[0]+nums[1];break;
   case '长度单位换算':expected=nums[0]*100;break;
   case '元角换算':expected=nums[0]*10+nums[1];break;
   case '两步加减应用':expected=nums[0]-nums[1]+nums[2];break;
   case '有余数的除法':expected=nums[0]%nums[1];break;
   case '长方形周长':expected=2*(nums[0]+nums[1]);break;
   case '千克与克':expected=nums[0]*1000;break;
   case '分数初步认识':expected=nums[1]/nums[0];break;
   case '混合运算':expected=nums[0]-nums[1]*nums[2];break;
   case '大数单位':expected=nums[0]*10000;break;
   case '长方形面积':expected=nums[0]*nums[1];break;
   case '时分换算':expected=nums[0]*60+nums[1];break;
   case '乘法结合律':expected=nums[0]*nums[1]*nums[2];break;
   case '同分母分数加法':expected=(nums[0]+nums[2])/nums[1];break;
   case '同分母分数减法':expected=(nums[0]-nums[2])/nums[1];break;
   case '长方体体积':expected=nums[0]*nums[1]*nums[2];break;
   case '平均数':expected=(nums[0]+nums[1]+nums[2])/3;break;
   case '小数与百分数':expected=nums[0]*100;break;
   case '求一个数的百分之几':expected=nums[0]*nums[1]/100;break;
   case '比的应用':expected=nums[2]/nums[0]*nums[1];break;
   case '圆的面积':expected=nums[0]**2*3.14;break;
   case '分数乘法':expected=nums[0]/nums[1]*nums[2];break;
   case '比例尺':expected=nums[1]*nums[2]/100;break;
   case '认识人民币':expected=nums[0]*10;break;
   case '表内乘法':expected=nums[0]*nums[1];break;
   case '除法与平均分':expected=nums[0]/nums[1];break;
  }
  if(expected!==undefined){assert.ok(Math.abs(numeric(q.options[q.answer])-expected)<1e-8,`${l.title}: ${q.prompt}`);checked++;}
 }
 assert.equal(checked,210);
});
test('pinyin additions retain correct tones and decomposition and do not invent f+i forms',()=>{
 let count=0;
 const toneSets=['āōīū','áóíú','ǎǒǐǔ','àòìù'];
 for(const l of expandedLessons.filter(l=>l.id.startsWith('72000000')))for(const q of l.questions.slice(5)){
  const answer=q.options[q.answer];
  let match=q.prompt.match(/^拆音节练习：(.+) 应拆成/);
  if(match)assert.equal(answer,`${match[1][0]}—${match[1].slice(1)}`);
  match=q.prompt.match(/^声调辨认：(.+) 标的是/);
  if(match){const t=toneSets.findIndex(set=>[...match![1]].some(c=>set.includes(c)));assert.equal(answer,['第一声','第二声','第三声','第四声'][t]);}
  match=q.prompt.match(/^拼读练习：([bpmf])—(.+)，应选/);
  if(match)assert.equal(answer,match[1]+match[2]);
  for(const o of q.options)assert.doesNotMatch(o,/f—?[iīíǐì]/);
  count++;
 }
 assert.equal(count,60);
});
test('publishing requires exactly ten complete questions, drafts can contain fewer',()=>{
 const l=expandedLessons[0];
 assert.equal(lessonWriteSchema.safeParse(l).success,true);
 assert.equal(lessonWriteSchema.safeParse({...l,questions:l.questions.slice(0,9)}).success,false);
 assert.equal(lessonWriteSchema.safeParse({...l,status:'draft',questions:l.questions.slice(0,3)}).success,true);
 assert.equal(lessonWriteSchema.safeParse({...l,status:'draft',questions:[...l.questions,{...l.questions[0],id:'75000000-0000-4000-8000-000000000001'}]}).success,false);
});
