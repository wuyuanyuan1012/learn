import payload from './math-grade1-volume2/lessons.json';
import { lessonWriteSchema } from '../lib/validation';
export const MATH_GRADE1_VOLUME2_BATCH = 'grade1-math-volume2-v1';
export const mathGrade1Volume2Lessons = payload.map(lesson => lessonWriteSchema.parse(lesson));
