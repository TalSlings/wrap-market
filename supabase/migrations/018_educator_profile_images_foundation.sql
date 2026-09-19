-- Infrastructure only. No gallery is exposed until its placement and editing flow are approved.
create table if not exists public.educator_profile_images (
  id uuid primary key default gen_random_uuid(),
  educator_id uuid not null references public.educator_profiles(id) on delete cascade,
  image_url text not null check (length(trim(image_url)) > 0),
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (educator_id, sort_order)
);

create index if not exists educator_profile_images_public_idx
  on public.educator_profile_images(educator_id, sort_order)
  where published;

alter table public.educator_profile_images enable row level security;
revoke all on public.educator_profile_images from anon, authenticated;
