import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mathEnrichmentLessons as lessons } from '../content/math-enrichment';
import manifest from '../content/math-enrichment/manifest.json';
import { lessonWriteSchema } from '../lib/validation';
import { availableCategories, categoryName } from '../lib/classification';

const questions = lessons.flatMap(l => l.questions);
const byId = new Map(questions.map(q => [q.id, q]));
// Source manifest uses stable IDs shared with the actual question payload.
function sourceQuestions(line:number) {
  const exercise=manifest.sourceExercises.find(e=>e.line===line)!;
  return exercise.questionIds.map(id=>byId.get(id)!);
}
function answer(line:number,index=0) { const q=sourceQuestions(line)[index];return q.options[q.answer]; }
function number(line:number,index=0) {return Number(answer(line,index).match(/\d+(?:\.\d+)?/)![0]);}

test('math enrichment is 36 published grade-two lessons of ten, with complete source coverage', () => {
  assert.equal(lessons.length,36);assert.equal(questions.length,360);
  assert.equal(new Set(lessons.map(l=>l.id)).size,36);
  assert.equal(new Set(questions.map(q=>q.id)).size,360);
  assert.equal(new Set(questions.map(q=>q.prompt.normalize('NFKC').replace(/\s+/g,''))).size,360);
  for(const l of lessons) {
    lessonWriteSchema.parse(l);assert.equal(l.questions.length,10);assert.equal(l.grade,2);assert.equal(l.subject,'math');assert.equal(l.category,'math-enrichment');assert.equal(l.status,'published');
    for(const q of l.questions)assert.doesNotMatch(q.prompt,/https:|<img|\$|【解析】/);
  }
  assert.equal(categoryName('math','math-enrichment'),'数学提高题');
  assert.equal(availableCategories(lessons,'math').find(c=>c.id==='math-enrichment')?.count,36);
  assert.equal(createHash('sha256').update(readFileSync(manifest.sourceFile)).digest('hex'),manifest.sourceSha256);
  const mapped=manifest.sourceExercises.flatMap(e=>e.questionIds);
  assert.deepEqual(new Set(mapped),new Set(byId.keys()));assert.equal(mapped.length,360);
  assert.equal(manifest.sourceExercises.length,464);
  for(const item of manifest.questions) {
    const lesson=lessons.find(l=>l.id===item.lessonId)!;
    const q=lesson.questions[item.questionIndex-1];
    assert.equal(q.options[q.answer],item.correct);
  }
});

test('source arithmetic and two-type counting answers are independently computed', () => {
  for(const item of manifest.questions) {
    const check=item.check;
    if(!check)continue;
    const q=lessons.find(l=>l.id===item.lessonId)!.questions[item.questionIndex-1];
    if(check.kind==='arithmetic') {
      const expression=check.expression!;
      let expected:number;
      if(expression.includes('dots')) expected=expression.startsWith('100-99')?50:2500;
      else {
        const safe=expression.replace(/\\times/g,'*').replace(/\\div/g,'/');
        assert.match(safe,/^[\d+\-*/().]+$/);
        expected=Function(`"use strict";return (${safe})`)() as number;
      }
      assert.equal(Number(q.options[q.answer]),expected,`line ${item.sourceLine}`);
    } else if(check.kind==='twoTypes') {
      const [a,b]=check.counts!;const [wa,wb]=check.weights!;
      assert.equal(a+b,check.total);assert.equal(a*wa+b*wb,check.amount);
      const solutions=[];
      for(let x=0;x<=check.total!;x++)if(x*wa+(check.total!-x)*wb===check.amount)solutions.push(x);
      assert.deepEqual(solutions,[a]);
    }
  }
});

test('enumeration, reverse operations, cycles and elimination preserve the original conditions', () => {
  const n=number(9);const digits=String(n).split('').map(Number);assert.equal(digits[1]-digits[0],4);assert.equal(digits[2]-digits[1],4);
  const twins=Array.from({length:1017},(_,i)=>1000+i).filter(n=>String(n)===String(n).split('').reverse().join(''));assert.equal(number(53),twins.length);
  const rope=number(850);let remaining=rope-(rope/2+2);remaining-=remaining/2-10;remaining-=15;assert.equal(remaining,9);
  let pieces=number(837);for(let i=0;i<3;i++)pieces=pieces/2+1;assert.equal(pieces,3);
  let list=Array.from({length:12},(_,i)=>i+1);while(list.length>1)list=list.filter((_,i)=>(list.length-1-i)%2===1);assert.equal(number(1200),list[0]);
  list=Array.from({length:12},(_,i)=>i+1);let index=0;while(list.length>1){index=(index+1)%list.length;list.splice(index,1);}assert.equal(number(1205),list[0]);
  const boxes=[6,4,5,3];for(let i=0;i<120;i++){const k=boxes.indexOf(Math.max(...boxes));for(let j=0;j<4;j++)boxes[j]+=j===k?-3:1;}assert.equal(number(1685),boxes[2]);
  for(const [line,total,max,takeLastLoses] of [[2492,18,3,0],[2496,50,3,0],[2512,28,5,1],[2528,54,6,1]]){
    const winning=[false];for(let n=1;n<=total;n++)winning[n]=Array.from({length:Math.min(n,max)},(_,i)=>i+1).some(t=>takeLastLoses&&t===n?false:!winning[n-t]);
    assert.equal(winning[total-number(line)],false);
  }
  const winning=[false];for(let n=1;n<=28;n++)winning[n]=[2,4,8].some(t=>t<=n&&!winning[n-t]);assert.equal(winning[28-number(2536)],false);
});

test('ambiguous or incomplete source exercises remain out of published questions', () => {
  for(const line of [786,878,1473,1596,1837,1894,2464,2508])assert.equal(sourceQuestions(line).length,0,`line ${line}`);
  // The handshake exercise really admits both 2 and 4; it must not get one answer.
  const possible=new Set<number>();const edges=[];for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)edges.push([i,j]);
  for(let mask=0;mask<1<<edges.length;mask++){
    const degree=[0,0,0,0,0];edges.forEach(([i,j],k)=>{if(mask&(1<<k)){degree[i]++;degree[j]++;}});
    if(degree.slice(0,4).join(',')==='3,4,4,3')possible.add(degree[4]);
  }
  assert.deepEqual([...possible].sort(),[2,4]);
});

test('explicit arithmetic equalities in explanations agree, including reverse reasoning', () => {
  let checked=0;
  for(const q of questions){
    const text=q.explanation.replace(/−/g,'-').replace(/（/g,'(').replace(/）/g,')');
    for(const m of text.matchAll(/[\d.+\-×÷()=]+/g)){
      if(!m[0].includes('=')||text.slice(m.index!+m[0].length).startsWith('余'))continue;
      const parts=m[0].replace(/\.$/,'').split('=');
      if(parts.some(p=>!p||p.startsWith(')')||p.endsWith('(')))continue;
      let values:number[];
      try {values=parts.map(p=>Function(`"use strict";return (${p.replace(/×/g,'*').replace(/÷/g,'/')})`)() as number);}catch{continue;}
      for(const v of values)assert.ok(Math.abs(v-values[0])<1e-8,`${q.prompt}: ${m[0]}`);
      checked++;
    }
  }
  assert.ok(checked>100);
});
