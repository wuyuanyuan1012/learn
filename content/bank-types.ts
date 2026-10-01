import type { Subject } from '../lib/types';
export type DraftQuestion = { prompt:string; correct:string; distractors:[string,string,string]; hint:string; explanation:string; context?:string };
export type DraftLesson = { title:string; topic:string; subject:Subject; grade:number; questions:DraftQuestion[] };
export type FactRow = [prompt:string,correct:string,wrong1:string,wrong2:string,wrong3:string,hint:string,explanation:string];
export function facts(subject:Subject,grade:number,title:string,topic:string,rows:FactRow[]):DraftLesson {
  return {subject,grade,title,topic,questions:rows.map(([prompt,correct,a,b,c,hint,explanation])=>({prompt,correct,distractors:[a,b,c],hint,explanation}))};
}
export function numberQuestion(prompt:string,result:number,unit:string,hint:string,explanation:string):DraftQuestion {
  const value=Number(result.toFixed(4));
  const choices=[value+1,value-1,value+2,value+3,value+10,value-2].filter(n=>n>=0 && n!==value);
  return {prompt,correct:`${value}${unit}`,distractors:choices.slice(0,3).map(n=>`${Number(n.toFixed(4))}${unit}`) as [string,string,string],hint,explanation};
}
export function fraction(n:number,d:number):string {
  const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
  const g=gcd(n,d);return d/g===1?String(n/g):`${n/g}/${d/g}`;
}
