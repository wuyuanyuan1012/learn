import payload from './bnu-math/lessons.json';
import { lessonWriteSchema } from '../lib/validation';
export const BNU_MATH_BATCH = 'bnu-primary-math-v1';
export const bnuMathLessons = payload.map(lesson => lessonWriteSchema.parse(lesson));
