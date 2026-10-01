import type { Subject } from './types';

// Stable IDs are stored in the database; display names can change independently.
export const categories = {
  chinese: [
    { id: 'chinese-pinyin', name: '拼音' }, { id: 'chinese-characters', name: '汉字' },
    { id: 'chinese-words', name: '词语' }, { id: 'chinese-sentences', name: '句子与标点' },
    { id: 'chinese-classics', name: '古诗文' }, { id: 'chinese-reading', name: '阅读理解' },
    { id: 'chinese-writing', name: '写话与习作' },
  ],
  math: [
    { id: 'math-numbers', name: '数的认识' }, { id: 'math-calculation', name: '计算' },
    { id: 'math-problems', name: '应用题' }, { id: 'math-geometry', name: '图形与几何' },
    { id: 'math-measurement', name: '单位与测量' }, { id: 'math-statistics', name: '统计与可能性' },
    { id: 'math-logic', name: '规律与逻辑' },
    { id: 'math-enrichment', name: '数学提高题' },
  ],
  english: [
    { id: 'english-phonics', name: '字母与发音' }, { id: 'english-vocabulary', name: '单词与短语' },
    { id: 'english-grammar', name: '句型与语法' }, { id: 'english-conversation', name: '情景交流' },
    { id: 'english-reading', name: '阅读理解' }, { id: 'english-writing', name: '书面表达' },
  ],
  science: [
    { id: 'science-life', name: '动植物与生命' }, { id: 'science-materials', name: '物质与材料' },
    { id: 'science-motion', name: '力与运动' }, { id: 'science-energy', name: '声光电与能量' },
    { id: 'science-earth', name: '地球与宇宙' }, { id: 'science-environment', name: '生态与环境' },
    { id: 'science-inquiry', name: '实验与探究' },
  ],
} as const satisfies Record<Subject, readonly { id: string; name: string }[]>;

// Explicitly reviewed mapping for the existing question bank. Unknown topics
// require an editor to choose a category rather than being silently guessed.
const topicGroups: Record<string, string[]> = {
  'chinese-pinyin': ['声母辨认', 'bpmf 与 a 的两拼音节', 'bpmf 与 o 的两拼音节', 'bpm 与 i 的两拼音节', 'bpmf 与 u 的两拼音节'],
  'chinese-characters': ['偏旁与字义', '字形与词义'],
  'chinese-words': ['反义词', '常用量词', '近义词', '词语搭配', '常用成语', '语境中的词义', '词语感情色彩'],
  'chinese-sentences': ['标点符号', '常见修辞', '句间关系', '修改病句'],
  'chinese-classics': ['古诗积累', '诗句理解', '文言词义'],
  'chinese-reading': ['阅读信息提取', '说明方法', '阅读推断'],
  'chinese-writing': ['表达顺序'],
  'math-numbers': ['数的顺序', '分数初步认识', '大数单位', '小数与百分数'],
  'math-calculation': ['10以内加减法', '10以内加法', '10以内减法', '20以内进位加法', '20以内退位减法', '表内乘法', '表内除法', '100以内加法', '三位数加法', '三位数减法', '两位数乘一位数', '有余数的除法', '混合运算', '除数是两位数', '乘法结合律', '小数加法', '小数乘法', '同分母分数加法', '同分母分数减法', '分数乘法'],
  'math-problems': ['生活中的加减法', '除法与平均分', '加法应用题', '两步加减应用', '求一个数的百分之几', '比的应用', '比例尺'],
  'math-geometry': ['认识多边形', '长方形周长', '角的分类', '长方形面积', '长方体体积', '圆的面积'],
  'math-measurement': ['认识人民币', '整时与半时', '长度单位换算', '元角换算', '千克与克', '时分换算'],
  'math-statistics': ['平均数'],
  'english-vocabulary': ['颜色启蒙', '动物词汇', '水果词汇', '学习用品', '身体部位', '家庭成员', '数字1至5', '常见职业', '地点词汇', '衣物词汇', '天气描述', '星期词汇', '月份词汇', '日常动词'],
  'english-grammar': ['方位介词', '物主代词', '形容词比较级', '一般过去时', '将来表达'],
  'english-conversation': ['日常问候'],
  'english-reading': ['短文信息提取'],
  'science-life': ['认识植物', '认识感官', '植物与环境', '动物特征', '消化与营养'],
  'science-materials': ['常见材料', '水的状态变化', '空气性质'],
  'science-motion': ['力与运动', '简单机械'],
  'science-energy': ['磁铁性质', '声音与振动', '光与影', '电路基础', '常见能量转化'],
  'science-earth': ['观察天气', '岩石与土壤', '天体与昼夜'],
  'science-environment': ['食物链与栖息地', '资源与环境'],
  'science-inquiry': ['公平实验与记录'],
};

export function isSubjectCategory(subject: Subject, category: string): boolean {
  return categories[subject].some(c => c.id === category);
}
export function categoryName(subject: Subject, category?: string | null): string {
  return categories[subject].find(c => c.id === category)?.name ?? '待分类';
}
export function inferCategory(subject: Subject, topic: string): string {
  return categories[subject].find(c => topicGroups[c.id]?.includes(topic))?.id ?? '';
}
export function suggestedTags(topic: string): string[] {
  if (/^bpmf? 与 [aoiu] 的两拼音节$/.test(topic)) {
    const vowel = topic.match(/与 ([aoiu]) /)![1];
    return [vowel === 'i' ? 'bpm' : 'bpmf', `${vowel} 的拼读`, '两拼音节', '声调'];
  }
  return topic ? [topic] : [];
}
type Classifiable = { subject: Subject; topic: string; category?: string | null; tags?: string[] | null };
export function withClassification<T extends Classifiable>(lesson: T): T & { category: string; tags: string[] } {
  return { ...lesson, category: lesson.category ?? inferCategory(lesson.subject, lesson.topic), tags: lesson.tags ?? suggestedTags(lesson.topic) };
}
export function lessonMatchesQuery(lesson: Classifiable & { title: string }, query: string): boolean {
  const classified = withClassification(lesson);
  const text = [lesson.title, lesson.topic, categoryName(lesson.subject, classified.category), ...classified.tags].join(' ').toLocaleLowerCase();
  return query.trim().toLocaleLowerCase().split(/\s+/).every(word => text.includes(word));
}
export function availableCategories(lessons: Classifiable[], subject: Subject) {
  const counts = new Map<string, number>();
  for (const l of lessons.filter(l => l.subject === subject)) {
    const id = withClassification(l).category;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return categories[subject].filter(c => counts.has(c.id)).map(c => ({ ...c, count: counts.get(c.id)! }));
}
