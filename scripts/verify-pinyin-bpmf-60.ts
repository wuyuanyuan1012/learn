import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { pinyinBank60 as questionBank } from '../content/pinyin-bpmf-60';
import assert from 'node:assert/strict';
loadEnvConfig(process.cwd());
async function main(){
 const e=process.env;
 const url=e.NEXT_PUBLIC_SUPABASE_URL||e.WYY_SUPABASE_URL;
 const key=e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||e.NEXT_PUBLIC_SUPABASE_ANON_KEY||e.NEXT_PUBLIC_WYY_SUPABASE_PUBLISHABLE_KEY||e.WYY_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error('MISSING_PUBLIC_CONFIG');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.from('learning_lessons').select('id,status,questions').order('id');
 if(error||!data)throw new Error('PUBLIC_READ_FAILED');
 const target=new Set(questionBank.map(l=>l.id));
 const added=data.filter(l=>target.has(l.id));
 if(added.length!==12||added.some(l=>l.status!=='published'||l.questions.length!==5))throw new Error('PUBLIC_BATCH_INCOMPLETE');
 for(const expected of questionBank){
  const actual=added.find(l=>l.id===expected.id);
  assert.deepEqual(actual?.questions,expected.questions);
 }
 console.log(JSON.stringify({verifiedAs:'anonymous visitor',publishedLessons:data.length,publishedQuestions:data.reduce((n,l)=>n+l.questions.length,0),newLessons:added.length,newQuestions:added.reduce((n,l)=>n+l.questions.length,0)},null,2));
}
main().catch(()=>{console.error('Public question-bank verification failed.');process.exitCode=1;});
