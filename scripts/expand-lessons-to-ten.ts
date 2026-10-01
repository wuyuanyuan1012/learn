import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { connectLearningDatabase } from './imports/database';
import { expandedLessons, originalLessons, TEN_QUESTION_BATCH } from '../content/ten-question-lessons';
import { normalizePrompt } from '../content/question-bank-500';
import { lessonSchema } from '../lib/validation';
import type { Lesson } from '../lib/types';

function untouched(row:Lesson){const {questions,description,minutes,updated_at,...rest}=row;void questions;void description;void minutes;void updated_at;return rest;}
async function main(){
 const apply=process.argv.includes('--apply');
 if(!apply&&!process.argv.includes('--check'))throw new Error('USE_CHECK_OR_APPLY');
 const db=await connectLearningDatabase();
 try {
  await db.query('begin');
  if(apply)await db.query('lock table public.learning_lessons in share row exclusive mode');
  const {rows:before}=await db.query<Lesson>('select * from public.learning_lessons order by id');
  if(before.length!==expandedLessons.length)throw new Error('LESSON_INVENTORY_CHANGED');
  const planned=before.map(row=>{
   const expected=expandedLessons.find(l=>l.id===row.id),original=originalLessons.find(l=>l.id===row.id);
   if(!expected||!original)throw new Error('UNKNOWN_LESSON');
   for(const field of ['subject','grade','topic'] as const)assert.equal(row[field],original[field],'LESSON_TOPIC_CHANGED');
   assert.deepEqual(row.questions.slice(0,5),original.questions,'ORIGINAL_QUESTIONS_CHANGED');
   if(row.questions.length===10){assert.deepEqual(row.questions,expected.questions,'EXPANDED_QUESTIONS_CHANGED');return row;}
   if(row.questions.length!==5)throw new Error('UNEXPECTED_QUESTION_COUNT');
   const next={...row,questions:[...row.questions,...expected.questions.slice(5)],description:row.description.replace(/(^|[^0-9])5道/g,(_,prefix:string)=>`${prefix}10道`),minutes:Math.max(row.minutes,expected.minutes)};
   lessonSchema.parse(next);return next;
  });
  const pending=planned.filter((row,i)=>row.questions.length!==before[i].questions.length);
  const prompts=new Set<string>(),ids=new Set<string>();
  for(const l of planned){assert.equal(l.questions.length,10);for(const q of l.questions){
   const normalized=normalizePrompt(q.prompt);if(prompts.has(normalized))throw new Error('DUPLICATE_PROMPT');prompts.add(normalized);
   if(ids.has(q.id))throw new Error('DUPLICATE_QUESTION_ID');ids.add(q.id);
  }}
  const beforeCount=before.reduce((n,l)=>n+l.questions.length,0);
  if(apply&&pending.length){
   await mkdir('content/import-reports',{recursive:true});
   // A recovery snapshot of lesson content only; no account data or credentials.
   await writeFile(`content/import-reports/${TEN_QUESTION_BATCH}-before-${Date.now()}.json`,JSON.stringify(before,null,2)+'\n');
   const result=await db.query(`update public.learning_lessons l set questions=x.questions,description=x.description,minutes=x.minutes
    from jsonb_to_recordset($1::jsonb) as x(id uuid,questions jsonb,description text,minutes integer) where l.id=x.id`,[JSON.stringify(pending.map(({id,questions,description,minutes})=>({id,questions,description,minutes})))]);
   assert.equal(result.rowCount,pending.length);
  }
  const {rows:after}=await db.query<Lesson>('select * from public.learning_lessons order by id');
  assert.equal(after.length,before.length);
  if(apply)after.forEach((row,i)=>{
   assert.deepEqual(untouched(row),untouched(before[i]));
   assert.deepEqual(row.questions.slice(0,5),before[i].questions.slice(0,5));
   assert.deepEqual(row.questions,planned[i].questions);
   assert.equal(row.description,planned[i].description);assert.equal(row.minutes,planned[i].minutes);
  });
  await db.query(apply?'commit':'rollback');
  const report={batch:TEN_QUESTION_BATCH,mode:apply?'applied':'check-only',lessons:before.length,questionsPerLesson:10,beforeQuestions:beforeCount,addedQuestions:apply?pending.length*5:0,pendingQuestions:pending.length*5,afterQuestions:after.reduce((n,l)=>n+l.questions.length,0),targetQuestions:planned.reduce((n,l)=>n+l.questions.length,0),originalQuestionsPreserved:true,metadataPreserved:true,sha256:createHash('sha256').update(JSON.stringify(planned.map(l=>({id:l.id,questions:l.questions})))).digest('hex')};
  await mkdir('content/import-reports',{recursive:true});await writeFile(`content/import-reports/${TEN_QUESTION_BATCH}-${apply?'applied':'check'}.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
 }catch(error){await db.query('rollback').catch(()=>{});throw error;}finally{await db.end();}
}
main().catch((e:unknown)=>{console.error(e instanceof Error&&/^[A-Z_]+$/.test(e.message)?e.message:'EXPANSION_FAILED_CHECK_DATA_OR_CONFIG');process.exitCode=1;});
