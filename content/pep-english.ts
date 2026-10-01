import payload from './pep-english/lessons.json';
import { lessonWriteSchema } from '../lib/validation';
export const PEP_ENGLISH_BATCH = 'pep-starting-line-english-v1';
export const pepEnglishLessons = payload.map(lesson => lessonWriteSchema.parse(lesson));
