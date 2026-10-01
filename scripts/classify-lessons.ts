import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { connectLearningDatabase } from './imports/database';
import { categoryName, isSubjectCategory, suggestedTags, withClassification } from '../lib/classification';
import type { Lesson } from '../lib/types';

function unchangedContent(row: Lesson) {
  const { category, tags, updated_at, ...rest } = row;
  void category; void tags; void updated_at;
  return rest;
}
async function main() {
  const apply = process.argv.includes('--apply');
  if (!apply && !process.argv.includes('--check')) throw new Error('USE_CHECK_OR_APPLY');
  const db = await connectLearningDatabase();
  try {
    await db.query('begin');
    if (apply) await db.query('lock table public.learning_lessons in access exclusive mode');
    const { rows: before } = await db.query<Lesson>('select * from public.learning_lessons order by id');
    const planned = before.map(row => {
      const normalized = withClassification(row);
      if (!isSubjectCategory(row.subject, normalized.category)) throw new Error('UNCLASSIFIED_TOPIC');
      // Preserve existing editorial classifications and tags on repeat execution.
      return { ...normalized, tags: row.category == null && !row.tags?.length ? suggestedTags(row.topic) : normalized.tags };
    });
    const pending = planned.filter((row, i) => row.category !== before[i].category || JSON.stringify(row.tags) !== JSON.stringify(before[i].tags));
    if (apply) {
      await db.query(await readFile(new URL('../supabase/migrations/20260930_lesson_classification.sql', import.meta.url), 'utf8'));
      if (pending.length) {
        const result = await db.query(`update public.learning_lessons l set category=x.category, tags=x.tags
          from jsonb_to_recordset($1::jsonb) as x(id uuid,category text,tags text[]) where l.id=x.id`, [JSON.stringify(pending.map(({ id, category, tags }) => ({ id, category, tags })))]);
        assert.equal(result.rowCount, pending.length);
      }
      const { rows: after } = await db.query<Lesson>('select * from public.learning_lessons order by id');
      assert.equal(after.length, before.length);
      after.forEach((row, i) => {
        assert.deepEqual(unchangedContent(row), unchangedContent(before[i]));
        assert.equal(row.category, planned[i].category);
        assert.deepEqual(row.tags, planned[i].tags);
      });
      await db.query("notify pgrst, 'reload schema'");
    }
    const distribution = planned.reduce<Record<string, number>>((counts, row) => {
      const key = `${row.subject} / ${categoryName(row.subject, row.category)}`;
      counts[key] = (counts[key] ?? 0) + row.questions.length;
      return counts;
    }, {});
    await db.query(apply ? 'commit' : 'rollback');
    const report = { mode: apply ? 'applied' : 'check-only', lessons: before.length, questions: before.reduce((n, l) => n + l.questions.length, 0), changedLessons: apply ? pending.length : 0, pendingLessons: pending.length, contentPreserved: true, distribution };
    await mkdir('content/import-reports', { recursive: true });
    await writeFile(`content/import-reports/classification-${apply ? 'applied' : 'check'}.json`, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    await db.query('rollback').catch(() => {});
    throw error;
  } finally { await db.end(); }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'CLASSIFICATION_FAILED_CHECK_CONFIG_OR_DATA');
  process.exitCode = 1;
});
