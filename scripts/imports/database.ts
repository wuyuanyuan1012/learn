import { loadEnvConfig } from '@next/env';
import { Client } from 'pg';
import { readFile } from 'node:fs/promises';
loadEnvConfig(process.cwd());
export async function connectLearningDatabase() {
  const e=process.env;
  const connection=e.WYY_POSTGRES_URL_NON_POOLING || e.POSTGRES_URL_NON_POOLING || e.WYY_POSTGRES_URL || e.DATABASE_URL;
  if(!connection) throw new Error('MISSING_DATABASE_CONFIG');
  const url=new URL(connection);url.searchParams.delete('sslmode');
  const db=new Client({connectionString:url.toString(),ssl:{ca:await readFile(new URL('../../supabase/certs/prod-ca-2021.crt',import.meta.url),'utf8'),rejectUnauthorized:true},connectionTimeoutMillis:15000,query_timeout:30000});
  await db.connect();return db;
}
