import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { mathGrade1Volume2Lessons as bank, MATH_GRADE1_VOLUME2_BATCH as batch } from '../content/math-grade1-volume2';
import { connectLearningDatabase } from './imports/database';
type Snapshot = { id: string; fingerprint: string; questions: number };

const fields = ['id','title','description','subject','grade','topic','minutes','status','questions','category','tags'] as const;
const contentSQL = `jsonb_build_object(${fields.map(k => `'${k}',l.${k}`).join(',')})`;
const snapshotSQL = 'select id,md5(to_jsonb(l)::text) as fingerprint,jsonb_array_length(questions) as questions from public.learning_lessons l order by id';
const normalize = (prompt: string) => prompt.normalize('NFKC').replace(/\s+/g, '');
async function main() {
  const apply = process.argv.includes('--apply');
  if (!apply && !process.argv.includes('--check')) throw new Error('USE_CHECK_OR_APPLY');
  if (bank.length !== 20 || bank.some(l => l.questions.length !== 10 || l.grade !== 1 || l.subject !== 'math')) throw new Error('INVALID_BATCH');
  const ids = new Set(bank.map(l => l.id));
  const prompts = bank.flatMap(l => l.questions.map(q => normalize(q.prompt)));
  if (new Set(prompts).size !== 200) throw new Error('DUPLICATE_BATCH_PROMPT');
  const db = await connectLearningDatabase();
  try {
    await db.query('begin');
    if (apply) {
      await db.query("set local lock_timeout='10s'");
      await db.query('lock table public.learning_lessons in share row exclusive mode');
    }
    const { rows: before } = await db.query<Snapshot>(snapshotSQL);
    const duplicates = await db.query(`select l.id from public.learning_lessons l cross join lateral jsonb_array_elements(l.questions) q
      where not (l.id=any($1::uuid[])) and regexp_replace(normalize(q->>'prompt',NFKC), '\\s+', '', 'g')=any($2::text[]) limit 1`, [[...ids],prompts]);
    if (duplicates.rows.length) throw new Error('DUPLICATE_EXISTING_PROMPT');
    const verifyPayload = JSON.stringify(bank);
    const conflicts = await db.query(`select l.id from public.learning_lessons l join jsonb_array_elements($1::jsonb) e on l.id=(e->>'id')::uuid where ${contentSQL}<>e`, [verifyPayload]);
    if (conflicts.rows.length) throw new Error('EXISTING_BATCH_WAS_EDITED');
    const pending = bank.filter(l => !before.some(row => row.id === l.id));
    let inserted = 0;
    if (apply && pending.length) {
      const result = await db.query(`insert into public.learning_lessons(id,title,description,subject,grade,topic,minutes,status,questions,category,tags)
        select id,title,description,subject,grade,topic,minutes,status,questions,category,tags
        from jsonb_to_recordset($1::jsonb) as x(id uuid,title text,description text,subject text,grade integer,topic text,minutes integer,status text,questions jsonb,category text,tags text[]) returning id`, [JSON.stringify(pending)]);
      inserted = result.rowCount ?? 0;
      if (inserted !== pending.length) throw new Error('INSERT_COUNT_MISMATCH');
    }
    const { rows: after } = await db.query<Snapshot>(snapshotSQL);
    for (const old of before) if (!isDeepStrictEqual(after.find(l => l.id === old.id), old)) throw new Error('EXISTING_DATA_CHANGED');
    if (apply) {
      const mismatch = await db.query(`select e->>'id' as id from jsonb_array_elements($1::jsonb) e left join public.learning_lessons l on l.id=(e->>'id')::uuid where l.id is null or ${contentSQL}<>e`, [verifyPayload]);
      if (mismatch.rows.length) throw new Error('READBACK_MISMATCH');
    }
    const count = (rows: Snapshot[]) => ({ lessons: rows.length, questions: rows.reduce((n,l) => n+l.questions, 0) });
    if (count(after).questions !== count(before).questions + inserted*10) throw new Error('TOTAL_COUNT_MISMATCH');
    await db.query(apply ? 'commit' : 'rollback');
    const report = { batch, mode: apply ? 'applied' : 'check-only', checkedAt: new Date().toISOString(), sha256: createHash('sha256').update(JSON.stringify(bank)).digest('hex'), before: count(before), batchTotal: { lessons: bank.length, questions: 200 }, pending: { lessons: pending.length, questions: pending.length*10 }, inserted: { lessons: inserted, questions: inserted*10 }, after: count(after), existingDataPreserved: true };
    await mkdir('content/import-reports', { recursive: true });
    await writeFile(`content/import-reports/${batch}-${apply ? 'applied' : 'check'}.json`, JSON.stringify(report, null, 2)+'\n');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) { await db.query('rollback').catch(() => {}); throw error; }
  finally { await db.end(); }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : 'IMPORT_FAILED_CHECK_CONFIG_OR_DATA');
  process.exitCode = 1;
});
