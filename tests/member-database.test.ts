import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('membership tables and RPCs reject public access; revocation and optimistic writes are atomic',async()=>{
 const db=new PGlite();
 try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
  await db.exec(await readFile('supabase/migrations/20260930_members.sql','utf8'));
  for(const role of ['anon','authenticated']){
   await db.exec(`set role ${role}`);
   for(const table of ['learning_members','learning_member_secrets','learning_member_sessions','learning_member_progress','learning_member_login_limits'])await assert.rejects(db.query(`select * from ${table}`),/permission denied/);
   await assert.rejects(db.query("select learning_member_manage(null,'no',2,true,'hash','lookup')"),/permission denied/);
   await assert.rejects(db.query("select learning_member_rate_limit('ip')"),/permission denied/);
   await assert.rejects(db.query("select learning_member_commit('fake',gen_random_uuid(),0,'{}')"),/permission denied/);
   await db.exec('reset role');
  }
  const create=await db.query<{id:string}>("select learning_member_manage(null,'测试会员',2,true,'hash','unique') as id");
  const id=create.rows[0].id;
  await assert.rejects(db.query("select learning_member_manage(null,'another',2,true,'hash','unique')"),/unique/);
  await db.query("insert into learning_member_sessions(token_hash,member_id,auth_version,expires_at) values('token',$1,1,now()+interval '30 days')",[id]);
  const state={records:[],sessions:{},plans:{},grade:3};
  assert.equal((await db.query<{ok:boolean}>('select learning_member_commit($1,$2,0,$3) as ok',['token',id,state])).rows[0].ok,true);
  assert.equal((await db.query<{ok:boolean}>('select learning_member_commit($1,$2,0,$3) as ok',['token',id,state])).rows[0].ok,false);
  await db.query("select learning_member_manage($1,'测试会员',2,true,'newhash','newlookup')",[id]);
  await assert.rejects(db.query('select learning_member_commit($1,$2,1,$3)',['token',id,state]),/UNAUTHORIZED/);
  // Even a racing login which inserts a token after password reset has the old version.
  await db.query("insert into learning_member_sessions(token_hash,member_id,auth_version,expires_at) values('racing', $1,1,now()+interval '30 days')",[id]);
  await assert.rejects(db.query('select learning_member_commit($1,$2,1,$3)',['racing',id,state]),/UNAUTHORIZED/);
  for(let i=0;i<30;i++)assert.equal((await db.query<{ok:boolean}>("select learning_member_rate_limit('ip') as ok")).rows[0].ok,true);
  assert.equal((await db.query<{ok:boolean}>("select learning_member_rate_limit('ip') as ok")).rows[0].ok,false);
 }finally{await db.close();}
});
