import assert from 'node:assert/strict';
import test from 'node:test';
import { pepEnglishLessons as bank } from '../content/pep-english';
import manifest from '../content/pep-english/question-manifest.json';
import sources from '../content/pep-english/sources.json';
import audit from '../content/pep-english/vocabulary-source-audit.json';
const qs=bank.flatMap(l=>l.questions);const byId=new Map(qs.map(q=>[q.id,q]));
test('12 books, 72 units: ten source-aligned foundation questions per unit and ten reading questions per book',()=>{
 assert.equal(bank.length,84);assert.equal(qs.length,840);assert.equal(sources.books.length,12);
 assert.equal(new Set(bank.map(l=>l.id)).size,84);assert.equal(new Set(qs.map(q=>q.id)).size,840);
 assert.equal(new Set(qs.map(q=>q.prompt.normalize('NFKC').replace(/\s+/g,''))).size,840);
 for(const l of bank){assert.equal(l.subject,'english');assert.equal(l.questions.length,10);assert.equal(l.status,'published');}
 for(const b of sources.books){
  assert.equal(b.units.length,6);assert.equal(b.tocVisuallyVerified,true);
  const rows=manifest.questions.filter(q=>q.book===b.id);assert.equal(rows.length,70);
  for(const u of b.units){const unit=rows.filter(q=>q.unit===u.number);assert.equal(unit.filter(q=>q.kind==='source-vocabulary').length,5);assert.equal(unit.filter(q=>q.kind==='unit-language-adaptation').length,5);}
  assert.equal(rows.filter(q=>q.kind==='original-reading-for-unit').length,10);
 }
 for(let g=1;g<=6;g++)assert.equal(bank.filter(l=>l.grade===g).length,14);
});
test('360 vocabulary items occur within their cited unit ranges, rather than an unrelated book',()=>{
 assert.equal(audit.entries.length,360);assert.equal(audit.unmatched.length,0);
 for(const row of audit.entries){
  const book=sources.books.find(b=>b.id===row.book)!;const u=book.units.find(u=>u.number===row.unit)!;
  assert.ok(row.pdfPages.length>0,row.word);assert.ok(row.pdfPages.every(p=>p>=u.pdfStart&&p<=u.pdfEnd&&p<=book.pages));
  const m=manifest.questions.find(q=>q.book===row.book&&q.unit===row.unit&&q.proof.word===row.word)!;
  assert.equal(m.correctAnswer,row.meaning);assert.equal(byId.get(m.questionId)!.options[byId.get(m.questionId)!.answer],row.meaning);
 }
});
test('all reading questions provide their own passage and a verbatim supporting span',()=>{
 const rows=manifest.questions.filter(q=>q.kind==='original-reading-for-unit');assert.equal(rows.length,120);
 const contexts=new Set<string>();
 for(const row of rows){const q=byId.get(row.questionId)!;assert.ok(q.context.length<=200&&q.context.length>60);assert.ok(q.context.includes(row.proof.evidence!));assert.equal(row.source.referenceType,'unit-knowledge-reference');assert.equal(row.category,'english-reading');contexts.add(q.context);}
 assert.equal(contexts.size,24);
});
test('reviewed grammar and factual answers with distinct distractors',()=>{
 const answers:Record<string,string>={
  'foot的复数是哪一个？':'feet',
  '两个西红柿应写成哪一个？':'two tomatoes',
  '补全复数：There are two ___ on the farm.':'sheep',
  '“butterfly”的复数是哪一个？':'butterflies',
  '补全过去问句：Did you ___ TV yesterday?':'watch',
  '补全“她每天刷牙”：She ___ her teeth every day.':'brushes',
  '补全“我喜欢帮助父母”：I enjoy ___ my parents.':'helping',
  '鲸属于哪类动物？':'mammals',
  '中国的教师节在什么时候？':'September 10th',
  '美国感恩节在十一月，加拿大在十月。哪句描述加拿大正确？':'Thanksgiving is in October in Canada.',
  '补全人物介绍：Xu Beihong was ___ artist.':'an',
  '阅读《比赛前后》：Lily当天是否参加了跑步？':'没有参加',
  '阅读《暑期明信片》：May昨天与爸爸去了哪里？':'大英博物馆',
 };
 for(const [prompt,a] of Object.entries(answers)){const q=qs.find(q=>q.prompt===prompt)!;assert.ok(q,prompt);assert.equal(q.options[q.answer],a);}
 for(const q of qs){assert.equal(new Set(q.options.map(o=>o.toLowerCase())).size,4);assert.ok(q.explanation);assert.ok(q.hint);}
 for(let a=0;a<4;a++)assert.equal(qs.filter(q=>q.answer===a).length,210);
 for(const row of manifest.questions){const q=byId.get(row.questionId)!;assert.equal(q.options[q.answer],row.correctAnswer);assert.ok(row.source.pdfStart<=row.source.pdfEnd);}
});
