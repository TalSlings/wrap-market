-- Run once in Supabase SQL Editor after uploading this update.
-- Safe to run more than once.

alter table public.user_profiles
  add column if not exists profile_image_path text,
  add column if not exists profile_setup_complete boolean not null default false;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-images',
  'profile-images',
  true,
  2097152,
  array['image/jpeg']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_images_insert_own on storage.objects;
create policy profile_images_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists profile_images_update_own on storage.objects;
create policy profile_images_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists profile_images_delete_own on storage.objects;
create policy profile_images_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.get_public_seller_identity(
  p_public_seller_id text
)
returns table (
  display_name text,
  avatar_key text,
  profile_image_path text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    up.display_name,
    coalesce(up.avatar_key, 'pawn-01') as avatar_key,
    up.profile_image_path
  from public.public_seller_profiles psp
  left join public.user_profiles up on up.user_id = psp.user_id
  where psp.public_seller_id::text = p_public_seller_id
  limit 1;
$$;

revoke all on function public.get_public_seller_identity(text) from public;
grant execute on function public.get_public_seller_identity(text) to anon, authenticated;
