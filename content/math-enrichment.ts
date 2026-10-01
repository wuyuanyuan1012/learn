import payload from './math-enrichment/lessons.json';
import { lessonWriteSchema } from '../lib/validation';

export const MATH_ENRICHMENT_BATCH = 'grade2-math-enrichment-v1';
export const mathEnrichmentLessons = payload.map(lesson => lessonWriteSchema.parse(lesson));
