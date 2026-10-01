import type { DraftQuestion } from './bank-types';
import type { Lesson } from '../lib/types';

export const PINYIN_BATCH = 'grade1-pinyin-bpmf-60-v1';
// Based on the user's first-grade b/p/m/f worksheet. Contextual readings are
// explicit: neutral tones and 不 sandhi must not be confused with citation tones.
type Reading = [word: string, character: string, syllable: string, note?: string];
const groups: { vowel: string; rows: Reading[]; extra: DraftQuestion[] }[] = [
  { vowel: 'a', rows: [
    ['八个', '八', 'bā'], ['拔牙', '拔', 'bá'], ['把手', '把', 'bǎ'], ['爸爸', '第一个爸', 'bà'],
    ['趴下', '趴', 'pā'], ['爬行', '爬', 'pá'], ['害怕', '怕', 'pà'],
    ['妈妈', '第一个妈', 'mā'], ['芝麻', '麻', 'má', '“麻”单独读 má，是第二声；在“芝麻”里通常读轻声 ma。'],
    ['马儿', '马', 'mǎ'], ['骂人', '骂', 'mà'],
    ['发现', '发', 'fā'], ['罚款', '罚', 'fá'], ['办法', '法', 'fǎ'],
    ['头发', '发', 'fà', '表示毛发的“发”，本调是 fà，第四声；在“头发”这个词里通常读轻声 fa。'],
  ], extra: [] },
  { vowel: 'o', rows: [
    ['波浪', '波', 'bō'], ['伯父', '伯', 'bó'], ['跛脚', '跛', 'bǒ'],
    ['薄荷', '薄', 'bò', '“薄”是多音字，在“薄荷”里读 bò，第四声。薄荷是一种有清凉气味的植物。'],
    ['山坡', '坡', 'pō'], ['外婆', '婆', 'pó'],
    ['笸箩', '笸', 'pǒ', '“笸箩”是一种盛东西的器具，其中“笸”读 pǒ，第三声。'],
    ['破坏', '破', 'pò'], ['摸鱼', '摸', 'mō'], ['耳膜', '膜', 'mó'],
    ['抹药', '抹', 'mǒ', '“抹”是多音字，表示涂抹药物时读 mǒ，第三声。'],
    ['沙漠', '漠', 'mò'], ['佛像', '佛', 'fó', '“佛”是多音字，在“佛像”里读 fó，第二声。'],
  ], extra: [
    { prompt: '声母 b 和带一声的韵母 ō 相拼，得到哪个音节？', correct: 'bō', distractors: ['pō', 'mō', 'bó'], hint: '先看声母，再看韵母上的声调。', explanation: 'b 和 ō 相拼是 bō，和“波浪”的“波”读音相同。' },
    { prompt: '“外婆”的“婆”读 pó，它是由哪一组拼成的？', correct: 'p—ó', distractors: ['b—ó', 'p—ò', 'm—ó'], hint: '把音节分成前面的声母和后面的韵母。', explanation: 'pó 可以拆成声母 p 和带第二声的单韵母 ó。' },
  ] },
  { vowel: 'i', rows: [
    ['逼真', '逼', 'bī'], ['鼻子', '鼻', 'bí'], ['毛笔', '笔', 'bǐ'], ['关闭', '闭', 'bì'],
    ['批发', '批', 'pī'], ['皮毛', '皮', 'pí'], ['马匹', '匹', 'pǐ'], ['放屁', '屁', 'pì'],
    ['猫咪', '咪', 'mī'], ['谜语', '谜', 'mí'], ['大米', '米', 'mǐ'], ['秘密', '密', 'mì'],
  ], extra: [
    { prompt: '把 b 和 ǐ 拼在一起，应该选哪个音节？', correct: 'bǐ', distractors: ['bí', 'pǐ', 'mǐ'], hint: '声母是 b，韵母上的声调是第三声。', explanation: 'b—ǐ 拼成 bǐ，是第三声，和“毛笔”的“笔”读音相同。' },
    { prompt: '音节 pí 的声调是第几声？', correct: '第二声', distractors: ['第一声', '第三声', '第四声'], hint: '看 í 上面的符号，它向右上方扬起。', explanation: 'pí 中的 í 标着第二声，读的时候声音上扬。' },
    { prompt: '把 m—ì 合起来拼读，哪个音节正确？', correct: 'mì', distractors: ['mí', 'bì', 'pì'], hint: '声母要保留 m，声调要保留第四声。', explanation: 'm 和 ì 相拼得到 mì，和“秘密”的“密”读音相同。' },
  ] },
  { vowel: 'u', rows: [
    ['不会', '不', 'bú', '“不”单独读 bù；在第四声的“会”（huì）前，实际读音变为第二声 bú，所以“不会”读 bú huì。'],
    ['补充', '补', 'bǔ'], ['脚步', '步', 'bù'],
    ['铺床', '铺', 'pū', '“铺”是多音字，表示把东西展开、摊平时读 pū，如“铺床”。'],
    ['葡萄', '葡', 'pú'], ['普通', '普', 'pǔ'],
    ['铺子', '铺', 'pù', '“铺”表示店铺时读 pù，如“铺子”；它的声母是 p，要归在 p 的拼读练习里。'],
    ['模样', '模', 'mú', '“模”是多音字，在“模样”里读 mú，第二声，不能读成 mó。'],
    ['母鸡', '母', 'mǔ'], ['木头', '木', 'mù'],
    ['孵蛋', '孵', 'fū'], ['福气', '福', 'fú'], ['斧头', '斧', 'fǔ'], ['父母', '父', 'fù'],
  ], extra: [
    { prompt: '“不”字单独读时，应该读哪个音？', correct: 'bù', distractors: ['bú', 'bǔ', 'pù'], hint: '这里没有后面的字，不需要变调。', explanation: '“不”单独读 bù，是第四声；在“不会”中，它受后面第四声的影响读 bú。' },
  ] },
];

const toneNames = ['第一声', '第二声', '第三声', '第四声'];
const marks = ['āōīū', 'áóíú', 'ǎǒǐǔ', 'àòìù'];
function tone(syllable: string) {
  return marks.findIndex(chars => [...syllable].some(c => chars.includes(c)));
}
function base(syllable: string) {
  return syllable.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function readingQuestion(row: Reading, pool: string[]): DraftQuestion {
  const [word, character, correct, note] = row;
  let prompt = `“${word}”中的“${character}”应该读哪个音？`;
  if (character.startsWith('第一个')) prompt = `“${word}”中的第一个“${word[0]}”应该读哪个音？`;
  if (word === '芝麻') prompt = '“芝麻”的“麻”单独读（不读轻声）时，应该读哪个音？';
  if (word === '头发') prompt = '表示毛发的“发”，本调（不读轻声）是哪个音？';
  if (word === '不会') prompt = '说“不会”时，按实际读音，“不”应该读哪个音？';
  const candidates = [...new Set(pool)].filter(s => s !== correct);
  // All distractors are valid syllables from this sheet; no invented f+i forms.
  const distractors = [
    ...candidates.filter(s => base(s) === base(correct)),
    ...candidates.filter(s => base(s) !== base(correct) && tone(s) === tone(correct)),
    ...candidates.filter(s => base(s) !== base(correct) && tone(s) !== tone(correct)),
  ].slice(0, 3) as [string, string, string];
  return {
    prompt, correct, distractors,
    hint: word === '不会' ? '“不”遇到后面的第四声时，读音会发生变化。' : `先试着读一读，注意声母 ${correct[0]} 和声调。`,
    explanation: note ?? `“${word}”中的“${character.replace('第一个', '')}”读 ${correct}，由声母 ${correct[0]} 和单韵母 ${base(correct).slice(1)} 相拼，是${toneNames[tone(correct)]}。`,
    context: '拼音小练习 · b、p、m、f',
  };
}

export const pinyinBank60: Lesson[] = groups.flatMap((group, groupIndex) => {
  const questions = [...group.rows.map(row => readingQuestion(row, group.rows.map(r => r[2]))), ...group.extra];
  if (questions.length !== 15) throw new Error('PINYIN_GROUP_SIZE');
  return [0, 1, 2].map(part => {
    const lessonIndex = groupIndex * 3 + part;
    return {
      id: `72000000-0000-4000-8000-${String(lessonIndex + 1).padStart(12, '0')}`,
      title: `拼音闯关：${group.vowel} 的拼读（${part + 1}）`,
      description: `用5道小题练习 ${group.vowel === 'i' ? 'b、p、m' : 'b、p、m、f'} 与 ${group.vowel} 的拼读，认清声母、韵母和声调。`,
      subject: 'chinese', grade: 1, topic: `${group.vowel === 'i' ? 'bpm' : 'bpmf'} 与 ${group.vowel} 的两拼音节`,
      minutes: 4, status: 'published', created_at: '2026-09-30T08:00:00.000Z', updated_at: '2026-09-30T08:00:00.000Z',
      questions: questions.slice(part * 5, part * 5 + 5).map((q, i) => {
        const number = lessonIndex * 5 + i;
        const answer = number % 4;
        const options: string[] = [...q.distractors];
        options.splice(answer, 0, q.correct);
        return { id: `73000000-0000-4000-8000-${String(number + 1).padStart(12, '0')}`, prompt: q.prompt, context: q.context ?? '', options, answer, hint: q.hint, explanation: q.explanation };
      }),
    };
  });
});
