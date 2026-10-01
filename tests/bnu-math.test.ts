import test from 'node:test';
import assert from 'node:assert/strict';
import { bnuMathLessons as bank } from '../content/bnu-math';
import rawManifest from '../content/bnu-math/manifest.json';
import sources from '../content/bnu-math/sources.json';
import coverage from '../content/bnu-math/coverage.json';
import checks from '../content/bnu-math/arithmetic-crosscheck.json';
type Proof = { expression?: string; value?: string; unit?: string; fraction?: boolean; inverseTemplate?: string; inverseRight?: string; dividend?: number; divisor?: number; quotient?: number; remainder?: number };
const manifest = rawManifest.questions as (Omit<typeof rawManifest.questions[number], 'proof'> & {proof: Proof|null})[];
const all=bank.flatMap(l=>l.questions);
const byId=new Map(all.map(q=>[q.id,q]));
// An independent exact rational parser uses decimal text, BigInt and recursive descent (no eval).
type Rational = [bigint,bigint];
function rational(n:bigint,d=BigInt(1)):Rational {assert.notEqual(d,BigInt(0));const gcd=(a:bigint,b:bigint):bigint=>b?gcd(b,a%b):a;const g=gcd(n<BigInt(0)?-n:n,d<BigInt(0)?-d:d);return [n/g*(d<BigInt(0)?-BigInt(1):BigInt(1)),(d<BigInt(0)?-d:d)/g];}
function calc(s:string):Rational {
 const tokens=s.match(/\d+(?:\.\d+)?|[()+*/-]/g)!;assert.equal(tokens.join(''),s.replace(/\s/g,''));let i=0;
 function atom():Rational {if(tokens[i]==='-'){i++;const a=atom();return [-a[0],a[1]];}if(tokens[i]==='('){i++;const n=sum();assert.equal(tokens[i++],')');return n;}const t=tokens[i++];assert.match(t,/^\d+(\.\d+)?$/);return rational(BigInt(t.replace('.','')),BigInt(10)**BigInt(t.split('.')[1]?.length??0));}
 function product():Rational {let a=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=atom();a=op==='*'?rational(a[0]*b[0],a[1]*b[1]):rational(a[0]*b[1],a[1]*b[0]);}return a;}
 function sum():Rational {let a=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();a=rational(a[0]*b[1]+(op==='+'?BigInt(1):-BigInt(1))*b[0]*a[1],a[1]*b[1]);}return a;}
 const result=sum();assert.equal(i,tokens.length);return result;
}
const normalized=(p:string)=>p.normalize('NFKC').replace(/\s/g,'');
test('12 books and 86 core units have at least ten questions each; all 199 lessons have ten',()=>{
 assert.equal(bank.length,199);assert.equal(all.length,1990);assert.equal(manifest.length,all.length);
 assert.equal(new Set([...bank,...all].map(q=>q.id)).size,bank.length+all.length);
 assert.equal(new Set(all.map(q=>normalized(q.prompt))).size,all.length);
 assert.equal(new Set(manifest.map(q=>q.book)).size,12);
 assert.deepEqual([...new Set(bank.map(l=>l.grade))].sort(),[1,2,3,4,5,6]);
 assert.equal(coverage.units.length,86);assert.ok(coverage.units.every(u=>u.questions>=10));
 for(const l of bank){assert.equal(l.questions.length,10);assert.equal(l.subject,'math');assert.equal(l.status,'published');assert.ok(l.tags.includes('北师大版'));}
 for(const b of sources.books){for(const u of b.units.filter(u=>!['整理与复习','总复习','数学好玩'].includes(u.name))){assert.ok(manifest.filter(q=>q.book===b.id&&q.source.unit===u.name).length>=10,`${b.id}/${u.name}`);}}
});
test('numeric answers, fraction equivalence, inverse equations and remainders independently recompute',()=>{
 let verified=0;
 for(const entry of manifest){
  const q=byId.get(entry.questionId)!;assert.equal(q.options[q.answer],entry.correctAnswer);const p=entry.proof;
  if(!p)continue;verified++;
  if(p.dividend!==undefined){assert.equal(p.divisor!*p.quotient!+p.remainder!,p.dividend);assert.ok(p.remainder!>=0&&p.remainder!<p.divisor!);assert.equal(entry.correctAnswer,`商${p.quotient}余${p.remainder}`);continue;}
  const result=p.inverseTemplate?calc(p.value!):calc(p.expression!);assert.deepEqual(result,calc(p.value!));
  const numericOptions=q.options.map(o=>calc(p.unit?o.slice(0,-p.unit.length):o));
  assert.deepEqual(numericOptions[q.answer],result,q.prompt);
  assert.equal(numericOptions.filter(a=>a[0]===result[0]&&a[1]===result[1]).length,1,q.prompt);
  if(p.inverseTemplate){assert.deepEqual(calc(p.inverseTemplate.replace('x',`(${p.value})`)),calc(p.inverseRight!));}
  if(entry.kind==='extracted'){const expression=q.prompt.slice('计算：'.length).split('＝')[0].replaceAll('×','*').replaceAll('÷','/').replaceAll('＋','+').replaceAll('－','-');assert.deepEqual(calc(expression),result);}
 }
 assert.ok(verified>1600);
 assert.deepEqual(calc('1/2+2/3*3/4'),[BigInt(1),BigInt(1)]);assert.deepEqual(calc('(2/5+1/10)/3'),[BigInt(1),BigInt(6)]);assert.deepEqual(calc('3.14*6*6*21/3'),[BigInt(19782),BigInt(25)]);
});
test('source references distinguish extracted arithmetic from knowledge-point adaptations',()=>{
 const cross=new Map(checks.map(c=>[c.key,c]));
 for(const q of manifest){
  const b=sources.books.find(b=>b.id===q.book)!;assert.equal(q.grade,b.grade);assert.equal(q.term,b.term);
  assert.equal(q.source.pdfPage,q.source.printedPage+4);assert.ok(q.source.pdfPage>4&&q.source.pdfPage<=b.pages);
  if(q.kind==='extracted'){assert.ok('cropKey' in q.source);const key=(q.source as {cropKey:string}).cropKey;assert.equal(cross.get(key)?.matched,true);}
  else if(q.kind==='adapted-inverse')assert.ok(q.source.adaptation);
  else assert.equal(q.kind,'adapted');
 }
 assert.equal(manifest.filter(q=>q.kind==='extracted').length,1047);
});
test('reviewed age limits and conceptual answers remain correct',()=>{
 assert.ok(bank.filter(l=>l.grade<=3).every(l=>l.questions.every(q=>!/[°]|\d+度/.test(q.prompt))));
 const facts:Record<string,string>={
  '下面哪个数是质数？':'13','关于1的说法，哪项正确？':'既不是质数也不是合数',
  '三根小棒长2厘米、3厘米、6厘米，能围成三角形吗？':'不能',
  '同一平面内，两条永不相交的直线是什么关系？':'平行',
  '2024年的2月有多少天？':'29天',
  '三角尺上方方正正的那个角叫什么？':'直角',
  '角的一条边画长一些，夹开的大小不变，角会怎样？':'大小不变',
  '把2＋2＋2改写成乘法，哪个算式合适？':'3×2',
 };
 for(const [prompt,answer] of Object.entries(facts)){const q=all.find(q=>q.prompt===prompt)!;assert.ok(q,prompt);assert.equal(q.options[q.answer],answer);}
 // Equivalent arithmetic distractors are not allowed even if their text differs.
 for(const q of all.filter(q=>q.prompt.includes('改写成乘法'))){const values=q.options.map(o=>calc(o.replaceAll('×','*').replaceAll('＋','+').replaceAll('－','-')));assert.equal(values.filter(v=>v[0]===values[q.answer][0]&&v[1]===values[q.answer][1]).length,1);}
});
