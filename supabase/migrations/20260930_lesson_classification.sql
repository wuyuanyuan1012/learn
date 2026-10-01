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
    when 'math' then category in ('math-numbers', 'math-calculation', 'math-problems', 'math-geometry', 'math-measurement', 'math-statistics', 'math-logic')
    when 'english' then category in ('english-phonics', 'english-vocabulary', 'english-grammar', 'english-conversation', 'english-reading', 'english-writing')
    when 'science' then category in ('science-life', 'science-materials', 'science-motion', 'science-energy', 'science-earth', 'science-environment', 'science-inquiry')
    else false end
);
alter table public.learning_lessons drop constraint if exists learning_lessons_tags_check;
alter table public.learning_lessons add constraint learning_lessons_tags_check check (public.valid_learning_tags(tags));
create index if not exists learning_lessons_category_idx on public.learning_lessons (status, grade, subject, category);
