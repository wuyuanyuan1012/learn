import type { DraftQuestion } from '../bank-types';
import type { Additions } from './helpers';
const vowels = ['a','o','i','u'];
const tones = ['第一声','第二声','第三声','第四声'];
const toneMarks=['āōīū','áóíú','ǎǒǐǔ','àòìù'];
function tone(s:string){return toneMarks.findIndex(chars=>[...s].some(c=>chars.includes(c)));}
function split(s:string):DraftQuestion {
 const correct=`${s[0]}—${s.slice(1)}`;
 const letters=s.includes('ī')||s.includes('í')||s.includes('ǐ')||s.includes('ì')?['b','p','m']:s.includes('ō')||s.includes('ó')||s.includes('ǒ')||s.includes('ò')?['b','p','m']:['b','p','m','f'];
 const alternatives=letters.filter(c=>c!==s[0]).map(c=>`${c}—${s.slice(1)}`);
 const base=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').slice(1);
 const mark=['ā','ō','ī','ū'][vowels.indexOf(base)];
 alternatives.push(`${s[0]}—${mark===s.slice(1)?['á','ó','í','ú'][vowels.indexOf(base)]:mark}`);
 return {prompt:`拆音节练习：${s} 应拆成哪一组？`,correct,distractors:alternatives.slice(0,3) as [string,string,string],hint:'前面是声母，后面是带声调的韵母。',explanation:`${s}由声母${s[0]}和带声调的韵母${s.slice(1)}组成，应拆成${correct}。`};
}
function toneQuestion(s:string):DraftQuestion {const correct=tones[tone(s)];return {prompt:`声调辨认：${s} 标的是第几声？`,correct,distractors:tones.filter(t=>t!==correct) as [string,string,string],hint:'一声平，二声扬，三声拐弯，四声降。',explanation:`${s}的声调符号是${s.slice(1)}上的标记，对应${correct}。`};}
function join(s:string,pool:string[]):DraftQuestion{return {prompt:`拼读练习：${s[0]}—${s.slice(1)}，应选哪个音节？`,correct:s,distractors:pool.filter(p=>p!==s).slice(0,3) as [string,string,string],hint:'声母读得轻短，接着读韵母，保留原来的声调。',explanation:`声母${s[0]}与韵母${s.slice(1)}相拼，得到${s}，读${tones[tone(s)]}。`};}
const groups=[
 {v:'a',split:['bā','bà','pā','má','fǎ'],tone:['bá','bǎ','pá','mǎ','fà'],join:['mā','pà','fá','mà','fā'],pool:['bā','bá','bǎ','bà','pā','pá','pà','mā','má','mǎ','mà','fā','fá','fǎ','fà']},
 {v:'o',split:['bó','bǒ','pǒ','mó','mǒ'],tone:['bò','pō','pò','mò','fó'],join:['bó','pō','mō','pǒ','mǒ'],pool:['bō','bó','bǒ','bò','pō','pó','pǒ','pò','mō','mó','mǒ','mò','fó']},
 {v:'i',split:['bī','bí','pī','pǐ','mī'],tone:['bì','pì','mí','mǐ','mì'],join:['bī','bí','pī','pǐ','mǐ'],pool:['bī','bí','bǐ','bì','pī','pí','pǐ','pì','mī','mí','mǐ','mì']},
 {v:'u',split:['bú','bǔ','pū','pù','mú'],tone:['bù','pú','pǔ','mǔ','fǔ'],join:['mù','fū','fú','fù','pù'],pool:['bú','bǔ','bù','pū','pú','pǔ','pù','mú','mǔ','mù','fū','fú','fǔ','fù']},
];
export const pinyinAdditions:Additions={};
for(const g of groups){
 // Each part practices decomposition, tone recognition and blending, instead
 // of placing all exercises of one type in a single lesson.
 const all=g.split.flatMap((s,i)=>[split(s),toneQuestion(g.tone[i]),join(g.join[i],g.pool)]);
 for(let part=0;part<3;part++)pinyinAdditions[`拼音闯关：${g.v} 的拼读（${part+1}）`]=all.slice(part*5,part*5+5);
}
