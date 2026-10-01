import assert from 'node:assert/strict';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { isSubjectCategory } from '../lib/classification';
import { lessonSchema } from '../lib/validation';
loadEnvConfig(process.cwd());

async function main() {
  const e = process.env;
  const url = e.NEXT_PUBLIC_SUPABASE_URL || e.WYY_SUPABASE_URL;
  const key = e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || e.NEXT_PUBLIC_SUPABASE_ANON_KEY || e.NEXT_PUBLIC_WYY_SUPABASE_PUBLISHABLE_KEY || e.WYY_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('MISSING_PUBLIC_CONFIG');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.from('learning_lessons').select('*').order('id');
  if (error || !data) throw new Error('PUBLIC_READ_FAILED');
  for (const row of data) {
    assert.equal(row.status, 'published');
    assert.ok(isSubjectCategory(row.subject, row.category));
    assert.ok(Array.isArray(row.tags));
    lessonSchema.parse(row);
  }
  console.log(JSON.stringify({ verifiedAs: 'anonymous visitor', lessons: data.length, questions: data.reduce((n, l) => n + l.questions.length, 0), populatedCategories: new Set(data.map(l => l.category)).size, unclassifiedLessons: 0 }, null, 2));
}
main().catch(() => { console.error('PUBLIC_CLASSIFICATION_VERIFICATION_FAILED'); process.exitCode = 1; });
