import type { Lesson, Question } from '../lib/types';
import { withClassification } from '../lib/classification';
import { lessonSchema } from '../lib/validation';
import { seedLessons } from '../lib/seed';
import { questionBank500, normalizePrompt } from './question-bank-500';
import { pinyinBank60 } from './pinyin-bpmf-60';
import { mathAdditions } from './expansion/math';
import { chineseAdditions } from './expansion/chinese';
import { englishAdditions } from './expansion/english';
import { scienceAdditions } from './expansion/science';
import { pinyinAdditions } from './expansion/pinyin';

export const TEN_QUESTION_BATCH='ten-questions-per-lesson-v1';
export const originalLessons=[...seedLessons,...questionBank500,...pinyinBank60];
const additions={...mathAdditions,...chineseAdditions,...englishAdditions,...scienceAdditions,...pinyinAdditions};
export const expandedLessons:Lesson[]=originalLessons.map((lesson,i)=>{
 const drafts=additions[lesson.title];
 if(!drafts||drafts.length!==5)throw new Error(`MISSING_ADDITIONS: ${lesson.title}`);
 const added:Question[]=drafts.map((q,j)=>{
  const answer=(i*5+j+1)%4;
  const options:string[]=[...q.distractors];options.splice(answer,0,q.correct);
  return {id:`74000000-0000-4000-8000-${String(i*5+j+1).padStart(12,'0')}`,prompt:q.prompt,context:q.context??'',options,answer,hint:q.hint,explanation:q.explanation};
 });
 const expanded={...withClassification(lesson),description:lesson.description.replace(/5道/g,'10道'),minutes:lesson.minutes*2,questions:[...lesson.questions,...added]};
 lessonSchema.parse(expanded);
 return expanded;
});
const prompts=new Set<string>();
for(const lesson of expandedLessons)for(const q of lesson.questions){const key=normalizePrompt(q.prompt);if(prompts.has(key))throw new Error(`DUPLICATE_PROMPT: ${q.prompt}`);prompts.add(key);}
export const expandedSeedLessons=expandedLessons.slice(0,seedLessons.length);
