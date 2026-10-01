export const subjects = { math: '数学', chinese: '语文', english: '英语', science: '科学' } as const;
export type Subject = keyof typeof subjects;
export const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
export type Question = { id: string; prompt: string; context: string; options: string[]; answer: number; hint: string; explanation: string };
export type Lesson = {
  id: string; title: string; description: string; subject: Subject; grade: number; topic: string;
  minutes: number; status: 'draft' | 'published'; questions: Question[]; created_at: string; updated_at: string;
  category?: string | null; tags?: string[] | null;
};
export type LessonSummary = Omit<Lesson, 'questions' | 'category' | 'tags'> & { questionCount: number; category: string; tags: string[] };
export type LearningRecord = {
  id: string; lessonId: string; title: string; subject: Subject; grade: number; correct: number; total: number;
  seconds: number; completedAt: string; wrongIds: string[];
};
