import { mkdir, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { connectLearningDatabase } from './imports/database';
async function main() {
  if (!process.argv.includes('--apply')) throw new Error('EXPLICIT_APPLY_REQUIRED');
  const db=await connectLearningDatabase();
  try {
    await db.query('begin');
    await db.query("set local lock_timeout='10s'");
    await db.query('lock table public.learning_lessons in share row exclusive mode');
    const summarySQL='select subject,count(*)::int as lessons,coalesce(sum(jsonb_array_length(questions)),0)::int as questions from public.learning_lessons group by subject order by subject';
    const unchangedSQL="select id,md5(to_jsonb(l)::text) as fingerprint from public.learning_lessons l where subject <> 'english' order by id";
    const {rows:before}=await db.query(summarySQL);
    const {rows:otherBefore}=await db.query(unchangedSQL);
    const deleted=await db.query("delete from public.learning_lessons where subject='english'");
    const {rows:after}=await db.query(summarySQL);
    const {rows:otherAfter}=await db.query(unchangedSQL);
    if(after.some(r=>r.subject==='english'))throw new Error('ENGLISH_NOT_EMPTY');
    if(!isDeepStrictEqual(otherBefore,otherAfter))throw new Error('OTHER_SUBJECT_CHANGED');
    const english=before.find(r=>r.subject==='english')??{lessons:0,questions:0};
    if(deleted.rowCount!==english.lessons)throw new Error('DELETE_COUNT_MISMATCH');
    await db.query('commit');
    const {rows:verification}=await db.query("select count(*)::int as lessons,coalesce(sum(jsonb_array_length(questions)),0)::int as questions from public.learning_lessons where subject='english'");
    if(verification[0].lessons!==0)throw new Error('POST_COMMIT_VERIFICATION_FAILED');
    const report={operation:'clear-all-english-lessons',completedAt:new Date().toISOString(),backupCreated:false,deleted:{lessons:english.lessons,questions:english.questions},remainingEnglish:verification[0],otherSubjectsUnchanged:true,memberDataModified:false,before,after};
    await mkdir('content/import-reports',{recursive:true});
    await writeFile('content/import-reports/clear-all-english-lessons-20261001.json',JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } catch(e) {await db.query('rollback').catch(()=>{});throw e;}
  finally{await db.end();}
}
main().catch((e:unknown)=>{console.error(e instanceof Error&&/^[A-Z_]+$/.test(e.message)?e.message:'CLEAR_ENGLISH_FAILED_CHECK_DATABASE');process.exitCode=1;});
