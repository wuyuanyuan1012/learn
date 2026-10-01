import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pinyinBank60 } from '../content/pinyin-bpmf-60';
import { questionBank500, normalizePrompt } from '../content/question-bank-500';
import { seedLessons } from '../lib/seed';
import { lessonSchema } from '../lib/validation';

const questions = pinyinBank60.flatMap(l => l.questions);
function find(fragment: string) {
  const matches = questions.filter(q => q.prompt.includes(fragment));
  assert.equal(matches.length, 1, fragment);
  return matches[0];
}
test('60 published grade-one Chinese questions validate and do not collide with existing content', () => {
  assert.equal(pinyinBank60.length, 12);
  assert.equal(questions.length, 60);
  const previous = [...seedLessons, ...questionBank500];
  const ids = new Set(previous.flatMap(l => [l.id, ...l.questions.map(q => q.id)]));
  const prompts = new Set(previous.flatMap(l => l.questions.map(q => normalizePrompt(q.prompt))));
  for (const lesson of pinyinBank60) {
    lessonSchema.parse(lesson);
    assert.equal(lesson.subject, 'chinese');
    assert.equal(lesson.grade, 1);
    assert.equal(lesson.status, 'published');
    assert.equal(lesson.questions.length, 5);
    for (const id of [lesson.id, ...lesson.questions.map(q => q.id)]) {
      assert.ok(!ids.has(id)); ids.add(id);
    }
    for (const q of lesson.questions) {
      const prompt = normalizePrompt(q.prompt);
      assert.ok(!prompts.has(prompt), q.prompt); prompts.add(prompt);
    }
  }
  assert.deepEqual([0, 1, 2, 3].map(a => questions.filter(q => q.answer === a).length), [15, 15, 15, 15]);
});
test('contextual polyphonic readings and neutral-tone exceptions are correctly distinguished', () => {
  for (const [fragment, expected] of [
    ['“铺床”中的', 'pū'], ['“铺子”中的', 'pù'], ['“模样”中的', 'mú'],
    ['“薄荷”中的', 'bò'], ['“抹药”中的', 'mǒ'], ['“佛像”中的', 'fó'],
    ['说“不会”时', 'bú'], ['“不”字单独读时', 'bù'],
    ['“芝麻”的“麻”单独读', 'má'], ['表示毛发的“发”，本调', 'fà'],
  ]) {
    const q = find(fragment);
    assert.equal(q.options[q.answer], expected, fragment);
  }
  assert.match(find('“芝麻”的“麻”单独读').explanation, /轻声 ma/);
  assert.match(find('表示毛发的“发”，本调').explanation, /轻声 fa/);
  assert.match(find('说“不会”时').explanation, /第四声.*第二声/);
  assert.match(find('“铺子”中的').explanation, /声母是 p/);
});
test('all syllable choices belong to the worksheet inventory and no f+i syllables are introduced', () => {
  const inventory = new Set('bā bá bǎ bà pā pá pà mā má mǎ mà fā fá fǎ fà bō bó bǒ bò pō pó pǒ pò mō mó mǒ mò fó bī bí bǐ bì pī pí pǐ pì mī mí mǐ mì bú bǔ bù pū pú pǔ pù mú mǔ mù fū fú fǔ fù'.split(' '));
  for (const q of questions) for (const choice of q.options) {
    if (/^[a-zāáǎàōóǒòīíǐìūúǔù]+$/.test(choice)) assert.ok(inventory.has(choice), choice);
    assert.doesNotMatch(choice, /f[īíǐìi]/);
  }
});
