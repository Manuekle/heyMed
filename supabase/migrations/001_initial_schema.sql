-- ============================================================
-- heyMed! — Schema inicial
-- ============================================================

-- Extensions
create extension if not exists "pg_net";

-- ============================================================
-- ENUMS
-- ============================================================

create type difficulty_level as enum ('easy', 'medium', 'hard');
create type ai_verdict      as enum ('correct', 'partial', 'incorrect');

-- ============================================================
-- TABLES
-- ============================================================

create table profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  username   text    unique not null,
  score      integer not null default 0,
  created_at timestamptz default now()
);

create table cases (
  id                 uuid default gen_random_uuid() primary key,
  description        text            not null,
  correct_diagnosis  text            not null,
  difficulty         difficulty_level not null default 'medium',
  created_at         timestamptz default now()
);

create table attempts (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  case_id         uuid references cases(id) on delete cascade not null,
  user_answer     text        not null,
  ai_result       ai_verdict,          -- null until evaluated
  ai_explanation  text,                -- null until evaluated
  created_at      timestamptz default now()
);

-- Indexes
create index idx_attempts_user_id  on attempts(user_id);
create index idx_attempts_case_id  on attempts(case_id);
create index idx_attempts_result   on attempts(ai_result);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table cases    enable row level security;
alter table attempts enable row level security;

-- profiles
create policy "own_profile_select" on profiles
  for select using (auth.uid() = id);

create policy "own_profile_update" on profiles
  for update using (auth.uid() = id);

-- cases (lectura pública)
create policy "cases_public_read" on cases
  for select using (true);

-- attempts
create policy "own_attempts_select" on attempts
  for select using (auth.uid() = user_id);

create policy "own_attempts_insert" on attempts
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-crear perfil al registrarse
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- TRIGGER: sumar puntos al recibir evaluación IA
-- ============================================================

create or replace function award_points_on_evaluation()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  diff  difficulty_level;
  pts   integer := 0;
begin
  select difficulty into diff from cases where id = new.case_id;

  pts := case new.ai_result
    when 'correct' then case diff
      when 'hard'   then 30
      when 'medium' then 20
      else               10
    end
    when 'partial' then case diff
      when 'hard'   then 10
      when 'medium' then 5
      else               2
    end
    else 0
  end;

  if pts > 0 then
    update profiles set score = score + pts where id = new.user_id;
  end if;

  return new;
end;
$$;

create trigger on_attempt_evaluated
  after update of ai_result on attempts
  for each row
  when (old.ai_result is null and new.ai_result is not null)
  execute function award_points_on_evaluation();

-- ============================================================
-- FUNCTION: precisión del usuario
-- ============================================================

create or replace function get_user_accuracy(p_user_id uuid)
returns jsonb
language plpgsql security definer
as $$
declare
  total     integer;
  correct   integer;
  partial   integer;
  incorrect integer;
begin
  select
    count(*),
    count(*) filter (where ai_result = 'correct'),
    count(*) filter (where ai_result = 'partial'),
    count(*) filter (where ai_result = 'incorrect')
  into total, correct, partial, incorrect
  from attempts
  where user_id = p_user_id;

  return jsonb_build_object(
    'total',     total,
    'correct',   correct,
    'partial',   partial,
    'incorrect', incorrect,
    'accuracy',  case
                   when total > 0
                   then round((correct::numeric / total) * 100, 1)
                   else 0
                 end
  );
end;
$$;
