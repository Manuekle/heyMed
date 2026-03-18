-- ============================================================
-- heyMed! — Settings: avatar_url, storage, delete_user
-- ============================================================

-- Avatar URL column on profiles
alter table profiles add column if not exists avatar_url text;

-- ── Storage bucket for avatars ──────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage RLS: users can upload/update their own avatar
-- Path convention: avatars/{user_id}/avatar.{ext}
create policy "avatar_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatar_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatar_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatar_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- ── delete_user(): called via RPC, deletes the caller ────────
create or replace function delete_user()
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
