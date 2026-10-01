import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { categories, availableCategories, categoryName, inferCategory, isSubjectCategory, lessonMatchesQuery, withClassification } from '../lib/classification';
import { seedLessons } from '../lib/seed';
import { questionBank500 } from '../content/question-bank-500';
import { pinyinBank60 } from '../content/pinyin-bpmf-60';
import { lessonSchema } from '../lib/validation';

const bank = [...seedLessons, ...questionBank500, ...pinyinBank60];
test('all 605 existing questions have reviewed subject-specific categories and searchable tags', () => {
  assert.equal(bank.reduce((n, l) => n + l.questions.length, 0), 605);
  for (const lesson of bank) {
    const l = withClassification(lesson);
    assert.ok(isSubjectCategory(l.subject, l.category), lesson.topic);
    assert.ok(l.tags.length > 0);
    assert.ok(lessonMatchesQuery(l, l.tags[0]));
    assert.ok(lessonMatchesQuery(l, categoryName(l.subject, l.category)));
    lessonSchema.parse(l);
  }
  assert.equal(inferCategory('math', '生活中的加减法'), 'math-problems');
  assert.equal(inferCategory('math', '20以内进位加法'), 'math-calculation');
  assert.equal(inferCategory('math', '全新知识点'), '');
  assert.equal(withClassification({ ...seedLessons[0], category: 'math-calculation', tags: ['自定义标签'] }).category, 'math-calculation');
  assert.ok(lessonMatchesQuery(pinyinBank60[0], 'BPMF 声调'));
});
test('category options exclude empty categories and respect grade and subject', () => {
  const options = availableCategories(bank.filter(l => l.grade === 1), 'chinese');
  assert.deepEqual(options.map(c => c.name), ['拼音', '词语']);
  assert.equal(options.find(c => c.name === '拼音')?.count, 13);
  assert.deepEqual(availableCategories([], 'math'), []);
});
test('server validation rejects foreign categories, unknown legacy topics and invalid tags', () => {
  const first = withClassification(seedLessons[0]);
  for (const change of [
    { category: 'chinese-pinyin' }, { category: '' }, { category: 'invented' },
    { category: undefined, topic: '没有配置的新知识点' },
    { tags: [' ', '计算'] }, { tags: ['计算', ' 计算 '] }, { tags: ['a'.repeat(41)] },
    { tags: Array.from({ length: 9 }, (_, i) => String(i)) },
  ]) assert.equal(lessonSchema.safeParse({ ...first, ...change }).success, false, JSON.stringify(change));
  assert.deepEqual(lessonSchema.parse({ ...first, tags: [' 声调 ', '拼读'] }).tags, ['声调', '拼读']);
});
test('additive SQL migration preserves old questions and enforces category and tag constraints', async () => {
  const db = new PGlite();
  try {
    await db.exec("create table public.learning_lessons(id integer primary key,subject text,grade integer,status text,questions jsonb);insert into public.learning_lessons values(1,'math',1,'published','[1,2,3]');");
    const sql = await readFile(new URL('../supabase/migrations/20260930_lesson_classification.sql', import.meta.url), 'utf8');
    await db.exec(sql); await db.exec(sql);
    const enrichment = await readFile(new URL('../supabase/migrations/20260930_math_enrichment.sql', import.meta.url), 'utf8');
    await db.exec(enrichment); await db.exec(enrichment);
    assert.deepEqual((await db.query('select questions,category,tags from public.learning_lessons')).rows, [{ questions: [1, 2, 3], category: null, tags: [] }]);
    // Every UI option must also be accepted by the database, for its subject only.
    for (const [subject, options] of Object.entries(categories)) for (const c of options) {
      await db.query('update public.learning_lessons set subject=$1,category=$2,tags=$3 where id=1', [subject, c.id, ['测试']]);
    }
    await assert.rejects(db.query("update public.learning_lessons set subject='math',category='chinese-pinyin' where id=1"));
    for (const tags of [[''], ['标签', '标签'], ['a'.repeat(41)], Array.from({ length: 9 }, (_, i) => String(i)), [null]]) {
      await assert.rejects(db.query('update public.learning_lessons set tags=$1 where id=1', [tags]));
    }
    assert.deepEqual((await db.query('select questions from public.learning_lessons')).rows, [{ questions: [1, 2, 3] }]);
  } finally { await db.close(); }
});
