import { z } from 'zod';
import { isSubjectCategory, withClassification } from './classification';
export const questionSchema = z.object({
  id: z.uuid(),
  prompt: z.string().trim().min(1, '请输入题目。').max(300),
  context: z.string().trim().max(200).default(''),
  options: z.array(z.string().trim().min(1, '请填写所有选项。').max(100)).length(4, '每道题需要四个选项。'),
  answer: z.number().int().min(0).max(3),
  hint: z.string().trim().min(1, '请填写提示。').max(300),
  explanation: z.string().trim().min(1, '请填写解析。').max(600),
}).refine(q => new Set(q.options).size === q.options.length, { message: '同一道题的选项不能重复。', path: ['options'] });
export const lessonSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, '请输入关卡名称。').max(60),
  description: z.string().trim().min(1, '请输入关卡简介。').max(200),
  subject: z.enum(['math', 'chinese', 'english', 'science']),
  grade: z.number().int().min(1).max(6),
  topic: z.string().trim().min(1, '请输入知识点。').max(40),
  category: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1, '标签不能为空。').max(40, '每个标签最多40字。')).max(8, '最多添加8个标签。').refine(tags => new Set(tags).size === tags.length, '标签不能重复。').optional(),
  minutes: z.number().int().min(1).max(30),
  status: z.enum(['draft', 'published']),
  questions: z.array(questionSchema).min(1, '至少添加一道题。').max(20, '每关最多20道题。'),
}).refine(l => new Set(l.questions.map(q => q.id)).size === l.questions.length, { message: '题目编号不能重复。', path: ['questions'] })
  .transform(withClassification)
  .refine(l => isSubjectCategory(l.subject, l.category), { message: '请选择当前学科下的主分类。', path: ['category'] });
export type LessonInput = z.infer<typeof lessonSchema>;

// Archived import batches remain structurally readable. New editor writes use
// ten questions for published lessons, while drafts may be incomplete.
export const lessonWriteSchema = lessonSchema
  .refine(l => l.questions.length <= 10, { message: '每关最多10道题。', path: ['questions'] })
  .refine(l => l.status !== 'published' || l.questions.length === 10, { message: '发布前请补齐10道题。', path: ['questions'] });
