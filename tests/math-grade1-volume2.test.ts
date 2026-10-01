import test from 'node:test';
import assert from 'node:assert/strict';
import { mathGrade1Volume2Lessons as bank } from '../content/math-grade1-volume2';
import manifest from '../content/math-grade1-volume2/manifest.json';
const questions=bank.flatMap(l=>l.questions);
// Independent arithmetic parser; no eval or execution of content strings.
function calculate(s:string):number {
 const tokens=s.match(/\d+|[()+*/-]/g)!;let i=0;
 function atom():number {if(tokens[i]==='-'){i++;return -atom();}if(tokens[i]==='('){i++;const n=sum();assert.equal(tokens[i++],')');return n;}const n=Number(tokens[i++]);assert.ok(Number.isFinite(n));return n;}
 function product():number {let n=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],v=atom();n=op==='*'?n*v:n/v;}return n;}
 function sum():number {let n=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],v=product();n=op==='+'?n+v:n-v;}return n;}
 const n=sum();assert.equal(i,tokens.length);return n;
}
test('200 questions cover eight units, seven categories, with ten per published lesson',()=>{
 assert.equal(bank.length,20);assert.equal(questions.length,200);
 assert.equal(new Set([...bank,...questions].map(x=>x.id)).size,220);
 assert.equal(new Set(questions.map(q=>q.prompt.normalize('NFKC').replace(/\s+/g,''))).size,200);
 assert.equal(new Set(bank.map(l=>l.tags[1])).size,8);
 assert.equal(new Set(bank.map(l=>l.category)).size,7);
 assert.equal(new Set(manifest.questions.map(q=>q.questionId)).size,200);
 for(const l of bank){assert.equal(l.questions.length,10);assert.equal(l.grade,1);assert.equal(l.subject,'math');assert.equal(l.status,'published');}
 const positions=[0,0,0,0];questions.forEach(q=>positions[q.answer]++);assert.deepEqual(positions,[50,50,50,50]);
});
test('all numeric and repeating-pattern answers are independently recomputed',()=>{
 let checked=0;
 for(const entry of manifest.questions){
  const q=questions.find(q=>q.id===entry.questionId)!;
  assert.equal(q.options[q.answer],entry.correctAnswer);
  assert.deepEqual(entry.pdfPages,entry.printedPages.map(p=>p+5));
  assert.ok(entry.printedPages.every(p=>p>=2&&p<=97));
  const p=entry.proof;if(!p)continue;checked++;
  if('expression' in p && p.expression){
   const result=calculate(p.expression);assert.equal(result,p.value);
   assert.equal(q.options[q.answer],`${result}${p.suffix}`);
   assert.ok(result>=0&&result<=100);
   if(q.prompt.startsWith('口算练习：')){
    const expr=q.prompt.replace('口算练习：','').split('＝')[0].replaceAll('＋','+').replaceAll('－','-').replaceAll('（','(').replaceAll('）',')');
    assert.equal(calculate(expr),result);
   }
   if(q.prompt.startsWith('退位减法卡：')){
    const [,a,b]=q.prompt.match(/(\d+)－(\d+)/)!;assert.equal(Number(a)-Number(b),result);
   }
  }else if('groupsTotal' in p && p.groupsTotal){
   const g=p.groupSize!;const n=p.value!;
   assert.equal(Math.floor(p.groupsTotal/g),n);assert.ok(n*g<=p.groupsTotal && (n+1)*g>p.groupsTotal);
   assert.equal(q.options[q.answer],`${n}${p.suffix}`);
   assert.ok(q.prompt.includes(`${p.groupsTotal}个`));assert.ok(q.prompt.includes(`${g}个`));
  }else if('cycle' in p && p.cycle){assert.equal(q.options[q.answer],p.cycle[(p.index!-1)%p.cycle.length]);}
  else assert.fail('unrecognized proof');
 }
 assert.equal(checked,158);
});
test('geometry, money and place-value concepts have the reviewed answers',()=>{
 const facts:Record<string,string>={
  '一张正方形纸有几条边？':'4条',
  '一套标准七巧板共有几块板？':'7块',
  '零钱盒里有37角，换成元和角怎样表示？':'3元7角',
  '人民币常用的单位是哪一组？':'元、角、分',
  '数字卡“72”中的7表示什么？':'7个十',
  '数字卡“46”中的6表示什么？':'6个一',
  '期末闯关：哪个数既大于68，又小于71？':'69',
 };
 for(const [prompt,answer] of Object.entries(facts)){const q=questions.find(q=>q.prompt===prompt)!;assert.equal(q.options[q.answer],answer);}
});
