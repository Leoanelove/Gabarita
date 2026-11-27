alter table public.study_cycles
  add column if not exists study_days text[]
  check (
    study_days is null or (
      cardinality(study_days) between 1 and 7
      and study_days <@ array['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']::text[]
    )
  );
