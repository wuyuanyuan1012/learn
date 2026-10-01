import { connectLearningDatabase } from './imports/database';
async function main(){
 const db=await connectLearningDatabase();
 try{
  const summary=await db.query('select subject,grade,status,count(*)::integer as lessons,sum(jsonb_array_length(questions))::integer as questions from public.learning_lessons group by subject,grade,status order by subject,grade,status');
  console.log(JSON.stringify(summary.rows,null,2));
 }finally{await db.end();}
}
main().catch(()=>{console.error('Could not inspect learning database.');process.exitCode=1;});
