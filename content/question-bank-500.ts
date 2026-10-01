import { mathLessons } from './math-200';
import { chineseLessons } from './chinese-100';
import { englishLessons } from './english-100';
import { scienceLessons } from './science-100';
import type { Lesson } from '../lib/types';
import { lessonSchema } from '../lib/validation';
export const QUESTION_BANK_BATCH = 'primary-foundations-500-v1';
const drafts=[...mathLessons,...chineseLessons,...englishLessons,...scienceLessons];
export const questionBank500:Lesson[]=drafts.map((draft,i)=>{
 if(draft.questions.length!==5) throw new Error(`Lesson ${i+1} must contain five questions.`);
 const lesson:Lesson={...draft,id:`70000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,minutes:4,status:'published',description:`一起练习${draft.topic}，用5道小题发现知识里的乐趣。`,created_at:'2026-09-30T06:00:00.000Z',updated_at:'2026-09-30T06:00:00.000Z',questions:draft.questions.map((q,j)=>{
  const answer=(i*5+j)%4;
  const options=[...q.distractors];options.splice(answer,0,q.correct);
  return {id:`71000000-0000-4000-8000-${String(i*5+j+1).padStart(12,'0')}`,prompt:q.prompt,context:q.context??'',options,answer,hint:q.hint,explanation:q.explanation};
 })};
 lessonSchema.parse(lesson);return lesson;
});
export function normalizePrompt(prompt:string){return prompt.normalize('NFKC').replace(/[\s，。！？、：；“”‘’「」《》?!.:;,"']/g,'');}
