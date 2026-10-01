import { Pool, type QueryResultRow } from 'pg';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
let pool:Pool|undefined;
export async function memberQuery<T extends QueryResultRow=QueryResultRow>(sql:string,values:unknown[]=[]){
 if(!pool){
  const e=process.env,connection=e.WYY_POSTGRES_URL||e.POSTGRES_URL||e.DATABASE_URL||e.WYY_POSTGRES_URL_NON_POOLING;
  if(!connection)throw new Error('会员数据库尚未配置。');
  const url=new URL(connection);url.searchParams.delete('sslmode');url.searchParams.delete('sslcert');url.searchParams.delete('sslrootcert');
  pool=new Pool({connectionString:url.toString(),max:2,idleTimeoutMillis:15000,connectionTimeoutMillis:12000,query_timeout:15000,allowExitOnIdle:true,ssl:{ca:readFileSync(join(process.cwd(),'supabase/certs/prod-ca-2021.crt'),'utf8'),rejectUnauthorized:true}});
  pool.on('error',()=>console.warn('Member database idle connection closed; will reconnect.'));
 }
 return pool.query<T>(sql,values);
}
