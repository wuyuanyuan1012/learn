import test from 'node:test';
import assert from 'node:assert/strict';
import { englishStartingLineLessons as bank } from '../content/english-starting-line';
import manifest from '../content/english-starting-line/manifest.json';
const questions = bank.flatMap(l => l.questions);
test('textbook import has 15 complete lessons with traceable source pages and no repeated questions', () => {
  assert.equal(bank.length,15);
  assert.equal(questions.length,150);
  assert.equal(new Set([...bank,...questions].map(x=>x.id)).size,165);
  assert.equal(new Set(questions.map(q=>q.prompt.normalize('NFKC').replace(/\s+/g,''))).size,150);
  assert.equal(manifest.questions.length,150);
  assert.equal(new Set(manifest.questions.map(q=>q.questionId)).size,150);
  assert.equal(new Set(bank.map(l=>l.tags[1])).size,9);
  for(const l of bank) {
    assert.equal(l.grade,1); assert.equal(l.subject,'english'); assert.equal(l.status,'published');
    assert.equal(l.questions.length,10);
    for(const q of l.questions) {
      const source=manifest.questions.find(s=>s.questionId===q.id)!;
      assert.equal(source.lessonId,l.id);
      assert.equal(source.correctAnswer,q.options[q.answer]);
      assert.deepEqual(source.pdfPages,source.printedPages.map(p=>p+5));
      assert.ok(source.printedPages.every(p=>p>=2&&p<=62));
    }
  }
});
test('core vocabulary answers match the textbook glossary and number words', () => {
  // Independently transcribed from printed pp. 58–59, visually verified against the PDF.
  const glossary: Record<string,string>={book:'书本',ruler:'尺子',pencil:'铅笔',schoolbag:'书包',teacher:'老师',face:'脸',ear:'耳朵',eye:'眼睛',nose:'鼻子',mouth:'嘴巴',dog:'狗',bird:'鸟',tiger:'老虎',monkey:'猴子',cat:'猫',black:'黑色',yellow:'黄色',blue:'蓝色',red:'红色',green:'绿色',apple:'苹果',pear:'梨',banana:'香蕉',orange:'橙子'};
  const seen=new Set<string>();
  for(const q of questions) {
    const match=q.prompt.match(/单词卡写着“([^”]+)”/);
    if(match) {assert.equal(q.options[q.answer],glossary[match[1]]);seen.add(match[1]);}
    const reverse=q.prompt.match(/卡片时，“([^”]+)”/);
    if(reverse) assert.equal(glossary[q.options[q.answer]],reverse[1]);
  }
  assert.equal(seen.size,24);
  const numbers=['one','two','three','four','five','six','seven','eight','nine','ten'];
  const numberLesson=bank.find(l=>l.topic==='数字一到十')!;
  numberLesson.questions.forEach((q,i)=>assert.equal(q.options[q.answer],numbers[i]));
});
test('reading questions include all needed text and positive/negative preference responses agree', () => {
  for(const q of bank.filter(l=>l.category==='english-reading').flatMap(l=>l.questions)) assert.ok(q.context.length>0);
  const prefs=bank.find(l=>l.topic==='询问水果喜好')!.questions;
  for(const q of prefs.filter(q=>q.prompt.includes('应怎样回答')||q.prompt.includes('应选择哪句回答'))) {
    assert.equal(q.options[q.answer],q.prompt.includes('不喜欢')?"No, I don't.":'Yes, I do.');
  }
});
