import env from '@next/env';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
env.loadEnvConfig(process.cwd());
const mode = process.argv[2] || 'inspect';
const email = process.argv[3];
const e = process.env;
const connectionString = e.WYY_POSTGRES_URL_NON_POOLING || e.POSTGRES_URL_NON_POOLING || e.WYY_POSTGRES_URL || e.DATABASE_URL;
const url = e.NEXT_PUBLIC_SUPABASE_URL || e.WYY_SUPABASE_URL;
const secret = e.SUPABASE_SERVICE_ROLE_KEY || e.WYY_SUPABASE_SERVICE_ROLE_KEY || e.WYY_SUPABASE_SECRET_KEY;
const databaseUrl = connectionString ? new URL(connectionString) : null;
// Keep hostname and CA validation enabled; URL sslmode must not override the CA.
databaseUrl?.searchParams.delete('sslmode');
const db = new pg.Client({
  connectionString: databaseUrl?.toString(),
  ssl: { ca: await readFile(new URL('../supabase/certs/prod-ca-2021.crt', import.meta.url), 'utf8'), rejectUnauthorized: true },
  connectionTimeoutMillis: 15000, query_timeout: 20000,
});
try {
  if (!connectionString || !url || !secret) throw new Error('MISSING_SETUP_CONFIG');
  await db.connect();
  if (mode === 'inspect') {
    const { rows } = await db.query("select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name");
    const buckets = await db.query('select id, public from storage.buckets');
    console.log(JSON.stringify({ tables: rows.map(r => r.table_name), buckets: buckets.rows }));
  } else if (mode === 'init') {
    await db.query('begin');
    try { await db.query(await readFile('supabase/schema.sql', 'utf8')); await db.query('commit'); }
    catch (err) { await db.query('rollback'); throw err; }
    console.log('Learning schema and access policies initialized.');
  } else if (mode === 'admin') {
    if (!email) throw new Error('ADMIN_EMAIL_REQUIRED');
    const api = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const existing = await db.query('select id from auth.users where lower(email)=lower($1)', [email]);
    let id = existing.rows[0]?.id;
    if (!id) {
      const password = randomBytes(24).toString('base64url') + 'aA1!';
      // Save before creating the user, so an interrupted request never loses the password.
      await writeFile('.env.admin.local', `ADMIN_EMAIL=${email}\nADMIN_PASSWORD=${password}\n`, { mode: 0o600, flag: 'wx' });
      const { data, error } = await api.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !data.user) throw new Error('ADMIN_CREATION_FAILED');
      id = data.user.id;
      console.log('New administrator credentials saved in .env.admin.local.');
    } else console.log('Existing account retained; password unchanged.');
    await db.query('insert into public.admins(user_id) values($1) on conflict do nothing', [id]);
    console.log('Administrator authorized.');
  } else throw new Error('UNKNOWN_MODE');
} catch (error) {
  // Never log connection strings or provider response bodies containing credentials.
  console.error('Setup failed:', error.code || (String(error.message).match(/^[A-Z_]+$/) ? error.message : 'CONNECTION_OR_QUERY_ERROR'));
  process.exitCode = 1;
} finally { await db.end().catch(() => {}); }
