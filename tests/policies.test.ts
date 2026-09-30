import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { seedLessons } from '../lib/seed';

test('learning database isolates drafts, rejects non-admin writes and validates question content', async () => {
  const db=new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create schema auth;
      create table auth.users(id uuid primary key,email text);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated;`);
    const schema=await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8');
    await db.exec(schema);await db.exec(schema);
    const admin='60000000-0000-4000-8000-000000000001',other='60000000-0000-4000-8000-000000000002';
    await db.query('insert into auth.users(id) values($1),($2)',[admin,other]);
    await db.query('insert into public.admins(user_id) values($1)',[admin]);
    const first=seedLessons[0],draft=seedLessons[1];
    const insert=`insert into public.learning_lessons(id,title,description,subject,grade,topic,minutes,status,questions) values($1,$2,$3,$4,$5,$6,$7,$8,$9)`;
    const values=(l: typeof first,status:string)=>[l.id,l.title,l.description,l.subject,l.grade,l.topic,l.minutes,status,JSON.stringify(l.questions)];
    await db.query(insert,values(first,'published'));await db.query(insert,values(draft,'draft'));
    async function asRole<T>(role:'anon'|'authenticated',user:string,run:()=>Promise<T>) {
      await db.exec('begin');
      try {await db.exec(`set local role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);const result=await run();await db.exec('commit');return result;}
      catch(error){await db.exec('rollback');throw error;}
    }
    for(const [role,user] of [['anon',''],['authenticated',other]] as const) {
      await asRole(role,user,async()=>{assert.deepEqual((await db.query('select id from public.learning_lessons')).rows,[{id:first.id}]);});
      await assert.rejects(()=>asRole(role,user,()=>db.query(insert,values(seedLessons[2],'published'))));
    }
    await asRole('authenticated',other,async()=>{
      assert.equal((await db.query("update public.learning_lessons set title='被篡改' returning id")).rows.length,0);
      assert.equal((await db.query('delete from public.learning_lessons returning id')).rows.length,0);
    });
    await assert.rejects(()=>asRole('authenticated',other,()=>db.query('insert into public.admins(user_id) values($1)',[other])));
    await asRole('authenticated',admin,async()=>{
      assert.equal((await db.query('select id from public.learning_lessons')).rows.length,2);
      await db.query("update public.learning_lessons set status='published' where id=$1",[draft.id]);
      await db.query(insert,values(seedLessons[2],'draft'));
    });
    await asRole('anon','',async()=>assert.equal((await db.query('select id from public.learning_lessons')).rows.length,2));
    await asRole('authenticated',admin,()=>db.query("update public.learning_lessons set status='draft' where id=$1",[first.id]));
    await asRole('anon','',async()=>assert.deepEqual((await db.query('select id from public.learning_lessons')).rows,[{id:draft.id}]));
    const q=first.questions[0];
    for(const invalid of [[],[{...q,answer:4}],[{...q,hint:''}],[{...q,options:['a','b','c','c']}],[{...q,options:['a','b','c',null]}],[q,q],[{...q,prompt:null}],[{...q,id:'invalid'}]]) {
      await assert.rejects(()=>db.query('update public.learning_lessons set questions=$1 where id=$2',[JSON.stringify(invalid),first.id]));
    }
    await asRole('authenticated',admin,()=>db.query('delete from public.learning_lessons where id=$1',[first.id]));
    assert.equal((await db.query('select id from public.learning_lessons where id=$1',[first.id])).rows.length,0);
  } finally {await db.close();}
});
