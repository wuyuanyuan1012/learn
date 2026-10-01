import type { DraftQuestion } from '../bank-types';
export type Row = [prompt:string,correct:string,wrong:string,hint:string,explanation:string];
export function rows(input:Row[]):DraftQuestion[]{return input.map(([prompt,correct,wrong,hint,explanation])=>{
 const distractors=wrong.split('|');if(distractors.length!==3)throw new Error(`Need three distractors: ${prompt}`);
 return {prompt,correct,distractors:distractors as [string,string,string],hint,explanation};
});}
export type Additions=Record<string,DraftQuestion[]>;
