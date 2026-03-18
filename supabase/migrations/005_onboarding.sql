-- ============================================================
-- heyMed! — Onboarding preferences
-- ============================================================

alter table profiles
  add column if not exists onboarded          boolean   not null default false,
  add column if not exists preferred_systems  text[]    default '{}',
  add column if not exists level              text      default 'estudiante',
  add column if not exists theme              text      default 'dark';

-- Existing users have already seen the app — skip onboarding for them
update profiles set onboarded = true where onboarded = false;
