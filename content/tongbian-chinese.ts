import payload from './tongbian-chinese/lessons.json';
import { lessonWriteSchema } from '../lib/validation';
export const TONGBIAN_CHINESE_BATCH = 'tongbian-primary-chinese-v1';
export const tongbianChineseLessons = payload.map(lesson => lessonWriteSchema.parse(lesson));
