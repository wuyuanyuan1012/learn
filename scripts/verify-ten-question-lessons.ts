import assert from 'node:assert/strict';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { expandedLessons } from '../content/ten-question-lessons';
loadEnvConfig(process.cwd());
async function main(){
 const e=process.env,url=e.NEXT_PUBLIC_SUPABASE_URL||e.WYY_SUPABASE_URL,key=e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||e.NEXT_PUBLIC_SUPABASE_ANON_KEY||e.NEXT_PUBLIC_WYY_SUPABASE_PUBLISHABLE_KEY||e.WYY_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error('MISSING_PUBLIC_CONFIG');
 const api=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await api.from('learning_lessons').select('id,questions,status,category,tags').order('id');
 if(error||!data)throw new Error('PUBLIC_READ_FAILED');
 assert.equal(data.length,expandedLessons.length);
 for(const l of data){const expected=expandedLessons.find(e=>e.id===l.id);assert.ok(expected);assert.equal(l.status,'published');assert.equal(l.questions.length,10);assert.deepEqual(l.questions,expected.questions);assert.ok(l.category);assert.ok(Array.isArray(l.tags));}
 console.log(JSON.stringify({verifiedAs:'anonymous visitor',lessons:data.length,questions:data.reduce((n,l)=>n+l.questions.length,0),everyLessonHasTenQuestions:true},null,2));
}
main().catch(()=>{console.error('PUBLIC_TEN_QUESTION_VERIFICATION_FAILED');process.exitCode=1;});
