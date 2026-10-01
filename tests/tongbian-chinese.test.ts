import test from 'node:test';
import assert from 'node:assert/strict';
import { tongbianChineseLessons as bank } from '../content/tongbian-chinese';
import manifest from '../content/tongbian-chinese/manifest.json';
import coverage from '../content/tongbian-chinese/coverage.json';
import source from '../content/tongbian-chinese/sources.json';
import audit from '../content/tongbian-chinese/pinyin-audit.json';
import sourceAudit from '../content/tongbian-chinese/source-audit.json';
import modules from '../content/tongbian-chinese/modules.json';
const questions=bank.flatMap(l=>l.questions);
const byId=new Map(questions.map(q=>[q.id,q]));
test('1340 unique questions in 134 published lessons cover all 12 books and 94 units',()=>{
 assert.equal(bank.length,134);assert.equal(questions.length,1340);assert.equal(manifest.questions.length,1340);
 assert.equal(new Set([...bank,...questions].map(q=>q.id)).size,1474);
 assert.equal(new Set(questions.map(q=>q.prompt.normalize('NFKC').replace(/\s/g,''))).size,1340);
 assert.equal(new Set(manifest.questions.map(q=>q.book)).size,12);assert.equal(coverage.coreUnits,94);
 assert.equal(new Set(bank.map(l=>l.category)).size,7);
 for(const l of bank){assert.equal(l.questions.length,10);assert.equal(l.subject,'chinese');assert.equal(l.status,'published');assert.ok(l.tags.includes('统编版'));}
 for(const b of source.books){for(const unit of b.units){const rows=manifest.questions.filter(q=>q.book===b.id&&q.source.unit===unit.number);assert.ok(rows.length>=10,`${b.id}/${unit.number}`);}}
 for(const q of manifest.questions){const b=source.books.find(b=>b.id===q.book)!;assert.equal(q.grade,b.grade);assert.equal(q.term,b.term);assert.equal(q.source.pdfPage,q.source.printedPage+5);assert.ok(q.source.pdfPage>5&&q.source.pdfPage<=b.pages);assert.equal(byId.get(q.questionId)?.options[byId.get(q.questionId)!.answer],q.correctAnswer);}
 const positions=[0,0,0,0];questions.forEach(q=>positions[q.answer]++);assert.deepEqual(positions,[335,335,335,335]);
});
test('460 lexical pronunciations agree with dictionary or explicitly reviewed contextual readings',()=>{
 assert.equal(audit.checked,460);assert.equal(audit.exactMatches,447);assert.equal(audit.contextualOverrides,13);
 const proofs=manifest.questions.filter(q=>q.proof?.type==='pinyin');assert.equal(proofs.length,460);
 for(const entry of audit.entries){
  const proof=proofs.find(q=>q.proof?.word===entry.word)!;assert.equal(proof.correctAnswer,entry.pinyin);
  const q=byId.get(proof.questionId)!;assert.equal(new Set(q.options).size,4);
  // Every option must differ in tone only, preventing accidental different word spellings.
  const unmark=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u0304\u030c]/g,'');
  for(const option of q.options)assert.equal(unmark(option),unmark(entry.pinyin));
  if(entry.match)assert.equal(entry.pinyin,entry.dictionaryPinyin);else assert.ok(entry.reviewNote);
 }
 const important:Record<string,string>={'琢磨':'zuó mo','汤汤':'shāng shāng','稚子':'zhì zǐ','参差':'cēn cī','倔强':'jué jiàng','惟妙惟肖':'wéi miào wéi xiào','贮藏':'zhù cáng','熨帖':'yù tiē','吆喝':'yāo he','锲而不舍':'qiè ér bù shě'};
 for(const [word,pinyin] of Object.entries(important))assert.equal(audit.entries.find(e=>e.word===word)?.pinyin,pinyin);
});
test('classical poems match source audit; original reading passages remain distinguished from textbook extracts',()=>{
 assert.equal(sourceAudit.totalPdfPages,1601);assert.equal(sourceAudit.poems.length,24);
 assert.ok(sourceAudit.poems.every(p=>p.linesVerified&&p.authorVerified&&p.dynastyVerified));
 assert.equal(manifest.questions.filter(q=>q.kind==='public-domain-poem-adaptation').length,120);
 const reading=manifest.questions.filter(q=>q.kind==='original-reading-for-unit');assert.equal(reading.length,120);
 for(const row of reading){const q=byId.get(row.questionId)!;assert.ok(q.context.length>=45&&q.context.length<=200);assert.equal(row.category,'chinese-reading');assert.equal(row.source.referenceType,'unit-knowledge-reference');}
 const facts:Record<string,string>={
  '《山行》的作者是谁？':'杜牧',
  '理解《山行》：“坐”在诗中是什么意思？':'因为',
  '《墨梅》的作者生活在哪个朝代？':'元',
  '理解《登鹳雀楼》：“欲”在诗中是什么意思？':'想要',
  '理解《书湖阴先生壁》：“排闼”在诗中是什么意思？':'推开门',
  '理解《泊船瓜洲》：“还”在诗中是什么意思？':'返回',
 };
 for(const [prompt,answer] of Object.entries(facts)){const q=questions.find(q=>q.prompt===prompt)!;assert.ok(q,prompt);assert.equal(q.options[q.answer],answer);}
 assert.ok(questions.find(q=>q.prompt==='《雪梅》的作者是谁？')!.context.includes('骚人阁笔费评章'));
});
test('reviewed phonics, literacy, grammar and source-limited reading answers',()=>{
 const facts:Record<string,string>={
  '音节“liú”的声调应标在哪里？':'u上',
  '音节“guī”的声调应标在哪里？':'i上',
  '“ju”中，写作u的韵母实际是哪一个？':'ü',
  '“口”字一共有几画？':'3画',
  '用部首查字法查“桥”，先查哪个部首？':'木',
  '“同学们认真地观察昆虫。”缩句后保留哪一句？':'同学们观察昆虫。',
  '“多数鸟能飞。”为什么不宜随便删去“多数”？':'避免把不会飞的鸟也包括进去',
  '阅读《小小保温杯》：“不低于六十摄氏度”是什么意思？':'至少六十摄氏度',
  '阅读《试一试再决定》：小鹿最后选择了怎样的地方过溪？':'水浅、石头稳的地方',
  '阅读《花坛观察簿》：月季午后怎样？':'仍然开放',
  '阅读《纸船小实验》：根据短文，哪句话可以直接得到支持？':'这次实验中，水里的纸船底部变软了',
  '阅读《旧本子》：“心里发热”在这里主要表达什么？':'想起鼓励而感动温暖',
 };
 for(const [prompt,answer] of Object.entries(facts)){const q=questions.find(q=>q.prompt===prompt)!;assert.ok(q,prompt);assert.equal(q.options[q.answer],answer);}
 for(const m of modules){assert.equal(m.questions.length,10);for(const q of m.questions){assert.equal(new Set([q.correct,...q.wrong]).size,4);assert.ok(q.explanation);}}
});
