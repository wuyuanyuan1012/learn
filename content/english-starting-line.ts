import payload from './english-starting-line/lessons.json';
import { lessonWriteSchema } from '../lib/validation';
export const ENGLISH_STARTING_LINE_BATCH = 'grade1-english-starting-line-v1';
export const englishStartingLineLessons = payload.map(lesson => lessonWriteSchema.parse(lesson));
