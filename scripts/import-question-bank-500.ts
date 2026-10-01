import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { questionBank500, normalizePrompt, QUESTION_BANK_BATCH } from '../content/question-bank-500';
import { withClassification } from '../lib/classification';
import { lessonSchema } from '../lib/validation';
import type { Lesson } from '../lib/types';
import { connectLearningDatabase } from './imports/database';
const fields=['id','title','description','subject','grade','topic','minutes','status','questions','category','tags'] as const;
function content(lesson:Lesson){return Object.fromEntries(fields.map(f=>[f,withClassification(lesson)[f]]));}
function same(a:unknown,b:unknown):boolean {
 if(a===b)return true;
 if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((x,i)=>same(x,b[i]));
 if(a&&b&&typeof a==='object'&&typeof b==='object'){
  const aa=a as Record<string,unknown>,bb=b as Record<string,unknown>;
  const keys=Object.keys(aa).sort();return same(keys,Object.keys(bb).sort())&&keys.every(k=>same(aa[k],bb[k]));
 }
 return false;
}
async function main(){
 const apply=process.argv.includes('--apply');
 if(!apply&&!process.argv.includes('--check'))throw new Error('USE_CHECK_OR_APPLY');
 if(questionBank500.length!==100 || questionBank500.reduce((n,l)=>n+l.questions.length,0)!==500)throw new Error('INVALID_BATCH_SIZE');
 const prompts=new Set<string>();
 const payload=questionBank500.map(lesson=>{
  const parsed=lessonSchema.parse(lesson);
  for(const q of parsed.questions){const key=normalizePrompt(q.prompt);if(prompts.has(key))throw new Error('DUPLICATE_BATCH_PROMPT');prompts.add(key);}
  return parsed;
 });
 const sha256=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
 const db=await connectLearningDatabase();
 try{
  await db.query('begin');
  if(apply)await db.query('lock table public.learning_lessons in share row exclusive mode');
  const {rows:before}=await db.query<Lesson>('select * from public.learning_lessons order by id');
  const ids=new Set(before.map(l=>l.id));
  const targetIds=new Set(questionBank500.map(l=>l.id));
  const otherPrompts=new Set(before.filter(l=>!targetIds.has(l.id)).flatMap(l=>l.questions.map(q=>normalizePrompt(q.prompt))));
  for(const l of questionBank500){
   const old=before.find(row=>row.id===l.id);
   if(old&&!same(content(old),content(l)))throw new Error('EXISTING_BATCH_LESSON_WAS_EDITED');
   for(const q of l.questions)if(otherPrompts.has(normalizePrompt(q.prompt)))throw new Error('DUPLICATE_EXISTING_PROMPT');
  }
  const pending=payload.filter(l=>!ids.has(l.id!));
  const beforeQuestions=before.reduce((n,l)=>n+l.questions.length,0);
  let inserted=0;
  if(apply&&pending.length){
   const response=await db.query(`insert into public.learning_lessons(id,title,description,subject,grade,topic,minutes,status,questions,category,tags)
    select id,title,description,subject,grade,topic,minutes,status,questions,category,tags
    from jsonb_to_recordset($1::jsonb) as x(id uuid,title text,description text,subject text,grade integer,topic text,minutes integer,status text,questions jsonb,category text,tags text[])
    returning id`,[JSON.stringify(pending)]);
   inserted=response.rowCount??0;
   if(inserted!==pending.length)throw new Error('INSERT_COUNT_MISMATCH');
  }
  const {rows:after}=await db.query<Lesson>('select * from public.learning_lessons order by id');
  for(const old of before){const current=after.find(l=>l.id===old.id);if(!current||!same(current,old))throw new Error('EXISTING_DATA_CHANGED');}
  if(apply){
   for(const expected of questionBank500){const actual=after.find(l=>l.id===expected.id);if(!actual||!same(content(actual),content(expected)))throw new Error('READBACK_MISMATCH');}
   if(after.reduce((n,l)=>n+l.questions.length,0)!==beforeQuestions+pending.length*5)throw new Error('TOTAL_COUNT_MISMATCH');
  }
  await db.query(apply?'commit':'rollback');
  const report={batch:QUESTION_BANK_BATCH,mode:apply?'applied':'check-only',checkedAt:new Date().toISOString(),sha256,
   before:{lessons:before.length,questions:beforeQuestions},batchTotal:{lessons:100,questions:500},pending:{lessons:pending.length,questions:pending.length*5},inserted:{lessons:inserted,questions:inserted*5},
   after:{lessons:after.length,questions:after.reduce((n,l)=>n+l.questions.length,0)},existingDataPreserved:true,
   bySubject:Object.fromEntries(['math','chinese','english','science'].map(s=>[s,questionBank500.filter(l=>l.subject===s).length*5])),
   byGrade:Object.fromEntries([1,2,3,4,5,6].map(g=>[g,questionBank500.filter(l=>l.grade===g).length*5]))};
  await mkdir('content/import-reports',{recursive:true});
  await writeFile(`content/import-reports/${QUESTION_BANK_BATCH}-${apply?'applied':'check'}.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
 }catch(error){await db.query('rollback').catch(()=>{});throw error;}finally{await db.end();}
}
main().catch((error:unknown)=>{
 const message=error instanceof Error && /^[A-Z_]+$/.test(error.message)?error.message:'IMPORT_FAILED_CHECK_CONFIG_OR_DATA';
 console.error(message);process.exitCode=1;
});
