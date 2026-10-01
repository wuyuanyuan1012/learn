import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { expandedSeedLessons as seedLessons } from '../content/ten-question-lessons';
import { lessonSchema } from '../lib/validation';
loadEnvConfig(process.cwd());
async function main() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.WYY_SUPABASE_URL;
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.WYY_SUPABASE_SERVICE_ROLE_KEY || process.env.WYY_SUPABASE_SECRET_KEY;
  if(!url || !secret) throw new Error('MISSING_SERVER_CONFIG');
  const supabase=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await supabase.from('learning_lessons').upsert(seedLessons.map(l=>lessonSchema.parse(l)),{onConflict:'id',ignoreDuplicates:true});
  if(error) throw new Error('SEED_INSERT_FAILED');
  console.log('Learning seed ready: 9 lessons, 90 questions. Existing lessons preserved.');
}
main().catch(()=>{console.error('Seed failed. Check server configuration and learning schema.');process.exitCode=1;});
