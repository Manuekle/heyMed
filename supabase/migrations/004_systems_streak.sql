-- ============================================================
-- heyMed! — Body systems + streak
-- ============================================================

create type body_system as enum ('cardio', 'neuro', 'gastro', 'urgencias', 'respiratorio', 'otro');

alter table cases add column if not exists system body_system not null default 'otro';

alter table profiles
  add column if not exists streak int not null default 0,
  add column if not exists last_practice_date date;

-- Update trigger to also track daily streak
create or replace function award_points_on_evaluation()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  diff      difficulty_level;
  pts       integer := 0;
  today     date    := current_date;
  last_date date;
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

  -- Streak: increment if yesterday, reset if older, skip if already today
  select last_practice_date into last_date from profiles where id = new.user_id;

  if last_date is null then
    update profiles set streak = 1, last_practice_date = today where id = new.user_id;
  elsif last_date < today then
    update profiles set
      streak = case when last_date = today - 1 then streak + 1 else 1 end,
      last_practice_date = today
    where id = new.user_id;
  end if;

  return new;
end;
$$;
