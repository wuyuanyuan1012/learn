-- Run once in Supabase → SQL Editor. Re-running is safe for existing content.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admins_read_self" on public.admins;
create policy "admins_read_self" on public.admins for select to authenticated using (user_id = auth.uid());
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.uniforms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 80),
  description text not null check (char_length(trim(description)) between 1 and 3000),
  season text not null check (season in ('autumn', 'winter', 'summer', 'other')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  image_path text not null check (image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'),
  image_width integer not null check (image_width between 1 and 20000),
  image_height integer not null check (image_height between 1 and 20000),
  image_crop jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_image_crop check (
    image_crop is null or (
      jsonb_typeof(image_crop) = 'object'
      and image_crop ?& array['x', 'y', 'width', 'height']
      and (image_crop->>'x')::integer >= 0 and (image_crop->>'y')::integer >= 0
      and (image_crop->>'width')::integer > 0 and (image_crop->>'height')::integer > 0
      and (image_crop->>'x')::integer + (image_crop->>'width')::integer <= image_width
      and (image_crop->>'y')::integer + (image_crop->>'height')::integer <= image_height
    )
  )
);
create index if not exists uniforms_published_idx on public.uniforms (status, created_at desc, id desc);
create index if not exists uniforms_image_idx on public.uniforms (image_path);
alter table public.uniforms enable row level security;
revoke all on public.uniforms from anon, authenticated;
grant select on public.uniforms to anon;
grant select, insert, update, delete on public.uniforms to authenticated;
drop policy if exists "uniforms_read" on public.uniforms;
create policy "uniforms_read" on public.uniforms for select to anon, authenticated
using (status = 'published' or public.is_admin());
drop policy if exists "uniforms_insert_admin" on public.uniforms;
create policy "uniforms_insert_admin" on public.uniforms for insert to authenticated
with check (public.is_admin() and split_part(image_path, '/', 1) = auth.uid()::text);
drop policy if exists "uniforms_update_admin" on public.uniforms;
create policy "uniforms_update_admin" on public.uniforms for update to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "uniforms_delete_admin" on public.uniforms;
create policy "uniforms_delete_admin" on public.uniforms for delete to authenticated using (public.is_admin());

create or replace function public.touch_uniform() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists uniform_updated_at on public.uniforms;
create trigger uniform_updated_at before update on public.uniforms
for each row execute function public.touch_uniform();

-- Private bucket: draft images cannot be read by visitors.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uniform-images', 'uniform-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "uniform_images_read" on storage.objects;
create policy "uniform_images_read" on storage.objects for select to anon, authenticated using (
  bucket_id = 'uniform-images' and (
    public.is_admin() or exists (select 1 from public.uniforms u where u.image_path = name and u.status = 'published')
  )
);
drop policy if exists "uniform_images_insert" on storage.objects;
create policy "uniform_images_insert" on storage.objects for insert to authenticated
with check (bucket_id = 'uniform-images' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "uniform_images_delete" on storage.objects;
create policy "uniform_images_delete" on storage.objects for delete to authenticated
using (bucket_id = 'uniform-images' and public.is_admin());
-- Uploaded objects are immutable. Replacements get a new random path.

-- After creating an email/password user in Authentication → Users, run:
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
-- on conflict (user_id) do nothing;
