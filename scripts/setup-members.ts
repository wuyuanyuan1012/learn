import { readFile } from 'node:fs/promises';
import { connectLearningDatabase } from './imports/database';
async function main(){
const db=await connectLearningDatabase();
try{
 const sql=await readFile('supabase/migrations/20260930_members.sql','utf8');
 await db.query('begin');await db.query(sql);await db.query('commit');
 console.log('Membership schema and restricted server functions installed. Existing lesson/admin data preserved.');
} catch(error){await db.query('rollback');throw new Error('Membership migration failed.',{cause:error});}finally{await db.end();}

}
main().catch(()=>{console.error("Membership migration failed; no transaction changes applied.");process.exitCode=1;});
