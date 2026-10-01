-- Additive membership data; existing lessons/admin accounts are preserved.
create table if not exists public.learning_member_secrets (
  id boolean primary key default true check(id),
  pepper text not null default (gen_random_uuid()::text || gen_random_uuid()::text)
);
insert into public.learning_member_secrets(id) values(true) on conflict do nothing;
create table if not exists public.learning_members (
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(name) between 1 and 40),
  grade integer not null default 2 check(grade between 1 and 6),
  active boolean not null default true,
  auth_version integer not null default 1,
  password_hash text not null,
  password_lookup text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.learning_member_sessions (
  token_hash text primary key,
  auth_version integer not null,
  member_id uuid not null references public.learning_members(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists learning_member_sessions_member on public.learning_member_sessions(member_id);
create table if not exists public.learning_member_progress (
  member_id uuid primary key references public.learning_members(id) on delete cascade,
  revision bigint not null default 0,
  state jsonb not null default '{"records":[],"sessions":{},"plans":{},"grade":2}',
  updated_at timestamptz not null default now()
);
create table if not exists public.learning_member_login_limits (
  bucket text primary key,
  attempts integer not null,
  window_start timestamptz not null default now()
);
alter table public.learning_member_secrets enable row level security;
alter table public.learning_members enable row level security;
alter table public.learning_member_sessions enable row level security;
alter table public.learning_member_progress enable row level security;
alter table public.learning_member_login_limits enable row level security;
revoke all on public.learning_member_secrets,public.learning_members,public.learning_member_sessions,public.learning_member_progress,public.learning_member_login_limits from public,anon,authenticated;
grant all on public.learning_member_secrets,public.learning_members,public.learning_member_sessions,public.learning_member_progress,public.learning_member_login_limits to service_role;

-- Limits are shared across every server instance, not held in process memory.
create or replace function public.learning_member_rate_limit(p_bucket text) returns boolean
language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  insert into learning_member_login_limits(bucket,attempts) values(p_bucket,1)
  on conflict(bucket) do update set
    attempts=case when learning_member_login_limits.window_start < now()-interval '15 minutes' then 1 else learning_member_login_limits.attempts+1 end,
    window_start=case when learning_member_login_limits.window_start < now()-interval '15 minutes' then now() else learning_member_login_limits.window_start end
  returning attempts into n;
  delete from learning_member_login_limits where window_start < now()-interval '1 day';
  delete from learning_member_sessions where expires_at < now();
  return n <= 30;
end; $$;

-- Password reset / deactivation invalidates all devices atomically.
create or replace function public.learning_member_manage(p_id uuid,p_name text,p_grade integer,p_active boolean,p_hash text,p_lookup text) returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
  if p_id is null then
    insert into learning_members(name,grade,active,password_hash,password_lookup) values(p_name,p_grade,p_active,p_hash,p_lookup) returning id into result;
    insert into learning_member_progress(member_id,state) values(result,jsonb_build_object('records','[]'::jsonb,'sessions','{}'::jsonb,'plans','{}'::jsonb,'grade',p_grade));
  else
    update learning_members set name=p_name,grade=p_grade,active=p_active,auth_version=auth_version+case when p_hash is not null or not p_active then 1 else 0 end,password_hash=coalesce(p_hash,password_hash),password_lookup=coalesce(p_lookup,password_lookup),updated_at=now() where id=p_id returning id into result;
    if result is null then raise exception 'MEMBER_NOT_FOUND'; end if;
    if p_hash is not null or not p_active then delete from learning_member_sessions where member_id=p_id; end if;
  end if;
  return result;
end; $$;

-- Compare-and-swap prevents two devices from overwriting each other's results.
-- Authentication is checked again inside the same transaction as the write.
create or replace function public.learning_member_commit(p_token text,p_member uuid,p_revision bigint,p_state jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
declare found_id uuid;
begin
  perform 1 from learning_members m join learning_member_sessions s on s.member_id=m.id
    where m.id=p_member and m.active and s.token_hash=p_token and s.expires_at>now() and s.auth_version=m.auth_version for share of m,s;
  if not found then raise exception 'MEMBER_UNAUTHORIZED'; end if;
  update learning_member_progress set state=p_state,revision=revision+1,updated_at=now()
    where member_id=p_member and revision=p_revision returning member_id into found_id;
  return found_id is not null;
end; $$;
revoke all on function public.learning_member_rate_limit(text),public.learning_member_manage(uuid,text,integer,boolean,text,text),public.learning_member_commit(text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.learning_member_rate_limit(text),public.learning_member_manage(uuid,text,integer,boolean,text,text),public.learning_member_commit(text,uuid,bigint,jsonb) to service_role;
notify pgrst, 'reload schema';
