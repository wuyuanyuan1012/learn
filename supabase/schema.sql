-- 趣味学习：可重复执行的独立学习题库。保留现有管理员身份。
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists admins_read_self on public.admins;
create policy admins_read_self on public.admins for select to authenticated using (user_id = auth.uid());
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.valid_learning_questions(qs jsonb) returns boolean
language plpgsql immutable set search_path = public as $$
declare q jsonb; opt jsonb; ids text[] := '{}';
begin
  if jsonb_typeof(qs) <> 'array' or jsonb_array_length(qs) not between 1 and 20 then return false; end if;
  for q in select value from jsonb_array_elements(qs) loop
    if jsonb_typeof(q) <> 'object' or not (q ?& array['id','prompt','context','options','answer','hint','explanation']) then return false; end if;
    if jsonb_typeof(q->'id') <> 'string' or (q->>'id') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or (q->>'id') = any(ids) then return false; end if;
    ids := array_append(ids, q->>'id');
    if jsonb_typeof(q->'prompt') <> 'string' or char_length(trim(q->>'prompt')) not between 1 and 300 then return false; end if;
    if jsonb_typeof(q->'context') <> 'string' or char_length(q->>'context') > 200 then return false; end if;
    if jsonb_typeof(q->'hint') <> 'string' or char_length(trim(q->>'hint')) not between 1 and 300 then return false; end if;
    if jsonb_typeof(q->'explanation') <> 'string' or char_length(trim(q->>'explanation')) not between 1 and 600 then return false; end if;
    if jsonb_typeof(q->'answer') <> 'number' or (q->>'answer') !~ '^[0-3]$' then return false; end if;
    if jsonb_typeof(q->'options') <> 'array' or jsonb_array_length(q->'options') <> 4 then return false; end if;
    if (select count(distinct trim(value #>> '{}')) from jsonb_array_elements(q->'options')) <> 4 then return false; end if;
    for opt in select value from jsonb_array_elements(q->'options') loop
      if jsonb_typeof(opt) <> 'string' or char_length(trim(opt #>> '{}')) not between 1 and 100 then return false; end if;
    end loop;
  end loop;
  return true;
exception when others then return false;
end; $$;
create table if not exists public.learning_lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 60),
  description text not null check (char_length(trim(description)) between 1 and 200),
  subject text not null check (subject in ('math','chinese','english','science')),
  grade integer not null check (grade between 1 and 6),
  topic text not null check (char_length(trim(topic)) between 1 and 40),
  minutes integer not null default 3 check (minutes between 1 and 30),
  status text not null default 'draft' check (status in ('draft','published')),
  questions jsonb not null check (public.valid_learning_questions(questions)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists learning_lessons_catalog_idx on public.learning_lessons (status, grade, subject, created_at);
alter table public.learning_lessons enable row level security;
revoke all on public.learning_lessons from anon, authenticated;
grant select on public.learning_lessons to anon;
grant select, insert, update, delete on public.learning_lessons to authenticated;
drop policy if exists lessons_read on public.learning_lessons;
create policy lessons_read on public.learning_lessons for select to anon, authenticated using (status = 'published' or public.is_admin());
drop policy if exists lessons_insert on public.learning_lessons;
create policy lessons_insert on public.learning_lessons for insert to authenticated with check (public.is_admin());
drop policy if exists lessons_update on public.learning_lessons;
create policy lessons_update on public.learning_lessons for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists lessons_delete on public.learning_lessons;
create policy lessons_delete on public.learning_lessons for delete to authenticated using (public.is_admin());
create or replace function public.touch_learning_lesson() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists learning_lesson_updated on public.learning_lessons;
create trigger learning_lesson_updated before update on public.learning_lessons for each row execute function public.touch_learning_lesson();
-- 在 Authentication 中创建管理员后授权：
-- insert into public.admins(user_id) select id from auth.users where email = 'YOUR_ADMIN_EMAIL' on conflict do nothing;

-- Additive migration: nullable category permits older clients during rollout.
-- New admin writes require a category; the backfill script classifies existing rows.
alter table public.learning_lessons add column if not exists category text;
alter table public.learning_lessons add column if not exists tags text[] not null default '{}';
create or replace function public.valid_learning_tags(tags text[]) returns boolean
language sql immutable set search_path = public as $$
  select coalesce(tags is not null and cardinality(tags) <= 8
    and (cardinality(tags) = 0 or array_ndims(tags) = 1)
    and not exists (select 1 from unnest(tags) t where t is null or char_length(trim(t)) not between 1 and 40 or t <> trim(t))
    and cardinality(tags) = (select count(distinct t) from unnest(tags) t), false)
$$;
alter table public.learning_lessons drop constraint if exists learning_lessons_category_subject_check;
alter table public.learning_lessons add constraint learning_lessons_category_subject_check check (
  category is null or case subject
    when 'chinese' then category in ('chinese-pinyin', 'chinese-characters', 'chinese-words', 'chinese-sentences', 'chinese-classics', 'chinese-reading', 'chinese-writing')
    when 'math' then category in ('math-numbers', 'math-calculation', 'math-problems', 'math-geometry', 'math-measurement', 'math-statistics', 'math-logic', 'math-enrichment')
    when 'english' then category in ('english-phonics', 'english-vocabulary', 'english-grammar', 'english-conversation', 'english-reading', 'english-writing')
    when 'science' then category in ('science-life', 'science-materials', 'science-motion', 'science-energy', 'science-earth', 'science-environment', 'science-inquiry')
    else false end
);
alter table public.learning_lessons drop constraint if exists learning_lessons_tags_check;
alter table public.learning_lessons add constraint learning_lessons_tags_check check (public.valid_learning_tags(tags));
create index if not exists learning_lessons_category_idx on public.learning_lessons (status, grade, subject, category);
