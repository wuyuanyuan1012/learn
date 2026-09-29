import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('database and image policies isolate admins, drafts and public content', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema storage;
      create table auth.users (id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
      alter table storage.objects enable row level security;
      create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
      grant usage on schema public, auth, storage to anon, authenticated;
      grant select, insert, update, delete on storage.objects to anon, authenticated;
    `);
    const schema = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
    await db.exec(schema);
    await db.exec(schema); // Verify initialization is repeatable without destroying data structures.
    const admin = '10000000-0000-4000-8000-000000000001';
    const other = '10000000-0000-4000-8000-000000000002';
    const publicId = '20000000-0000-4000-8000-000000000001';
    const draftId = '20000000-0000-4000-8000-000000000002';
    const publicPath = `${admin}/${publicId}.png`, draftPath = `${admin}/${draftId}.png`;
    await db.query('insert into auth.users (id,email) values ($1,$2),($3,$4)', [admin, 'admin@example.com', other, 'reader@example.com']);
    await db.query('insert into public.admins(user_id) values($1)', [admin]);
    await db.query(`insert into public.uniforms(id,title,description,season,status,image_path,image_width,image_height) values ($1,'公开款','介绍','autumn','published',$2,1000,600),($3,'草稿款','介绍','winter','draft',$4,1000,600)`, [publicId, publicPath, draftId, draftPath]);
    await db.query('insert into storage.objects(bucket_id,name) values ($1,$2),($1,$3)', ['uniform-images', publicPath, draftPath]);
    async function asRole<T>(role: 'anon' | 'authenticated', user: string, run: () => Promise<T>) {
      await db.exec('begin');
      try {
        await db.exec(`set local role ${role}`);
        await db.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
        const result = await run(); await db.exec('commit'); return result;
      } catch (error) { await db.exec('rollback'); throw error; }
    }
    for (const [role, user] of [['anon', ''], ['authenticated', other]] as const) {
      await asRole(role, user, async () => {
        const records = await db.query('select id from public.uniforms');
        assert.deepEqual(records.rows, [{ id: publicId }]);
        const images = await db.query('select name from storage.objects');
        assert.deepEqual(images.rows, [{ name: publicPath }]);
        const deleted = await db.query('delete from storage.objects returning id');
        assert.equal(deleted.rows.length, 0);
      });
    }
    await assert.rejects(() => asRole('authenticated', other, () => db.query('insert into public.admins(user_id) values($1)', [other])));
    await assert.rejects(() => asRole('authenticated', other, () => db.query(`insert into public.uniforms(title,description,season,image_path,image_width,image_height) values ('伪造','内容','autumn',$1,100,100)`, [`${other}/${publicId}.png`])));
    await assert.rejects(() => asRole('authenticated', other, () => db.query('insert into storage.objects(bucket_id,name) values($1,$2)', ['uniform-images', `${other}/unauthorized.png`])));
    await asRole('authenticated', admin, async () => {
      assert.equal((await db.query('select id from public.uniforms')).rows.length, 2);
      assert.equal((await db.query('select name from storage.objects')).rows.length, 2);
      await db.query('update public.uniforms set status=$1 where id=$2', ['published', draftId]);
      await db.query('insert into storage.objects(bucket_id,name) values($1,$2)', ['uniform-images', `${admin}/new.png`]);
    });
    await asRole('anon', '', async () => {
      assert.equal((await db.query('select id from public.uniforms')).rows.length, 2);
      assert.equal((await db.query('select name from storage.objects')).rows.length, 2);
    });
    await assert.rejects(() => asRole('authenticated', admin, () => db.query('insert into storage.objects(bucket_id,name) values($1,$2)', ['uniform-images', `${other}/wrong-owner.png`])));
    await asRole('authenticated', admin, async () => {
      await db.query('update public.uniforms set status=$1 where id=$2', ['draft', publicId]);
    });
    await asRole('anon', '', async () => {
      assert.deepEqual((await db.query('select name from storage.objects')).rows, [{ name: draftPath }]);
    });
    await assert.rejects(() => db.query('update public.uniforms set image_crop=$1 where id=$2', [{ x: 900, y: 0, width: 200, height: 100 }, publicId]));
  } finally { await db.close(); }
});
