-- Expand the existing category constraint; question and membership data are unchanged.
alter table public.learning_lessons drop constraint if exists learning_lessons_category_subject_check;
alter table public.learning_lessons add constraint learning_lessons_category_subject_check check (
  category is null or case subject
    when 'chinese' then category in ('chinese-pinyin', 'chinese-characters', 'chinese-words', 'chinese-sentences', 'chinese-classics', 'chinese-reading', 'chinese-writing')
    when 'math' then category in ('math-numbers', 'math-calculation', 'math-problems', 'math-geometry', 'math-measurement', 'math-statistics', 'math-logic', 'math-enrichment')
    when 'english' then category in ('english-phonics', 'english-vocabulary', 'english-grammar', 'english-conversation', 'english-reading', 'english-writing')
    when 'science' then category in ('science-life', 'science-materials', 'science-motion', 'science-energy', 'science-earth', 'science-environment', 'science-inquiry')
    else false end
);
