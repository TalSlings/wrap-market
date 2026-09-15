-- Foundation only: no Wix records are inserted and publication defaults to off.
create table if not exists public.educator_profiles (
  id uuid primary key default gen_random_uuid(),
  wix_id text unique,
  owner_id uuid unique references auth.users(id) on delete set null,
  full_name text not null check (length(trim(full_name)) > 0),
  photo_url text,
  training text,
  additional_professions text,
  related_professions text,
  volunteer_work text,
  teaching_approach text,
  about text,
  reception_place text,
  reception_notes text,
  region_notes text,
  availability_notes text,
  online_available boolean not null default false,
  online_notes text,
  phone text,
  contact_email text,
  website_url text,
  instagram_url text,
  facebook_url text,
  other_social_url text,
  status text not null default 'hidden' check (status in ('active','paused','hidden')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.educator_service_regions (
  educator_id uuid not null references public.educator_profiles(id) on delete cascade,
  region_id uuid not null references public.regions(id),
  primary key (educator_id, region_id)
);

create table if not exists public.educator_service_subregions (
  educator_id uuid not null references public.educator_profiles(id) on delete cascade,
  subregion_id uuid not null references public.subregions(id),
  primary key (educator_id, subregion_id)
);

create index if not exists educator_service_regions_region_idx
  on public.educator_service_regions(region_id);
create index if not exists educator_service_subregions_subregion_idx
  on public.educator_service_subregions(subregion_id);
create index if not exists educator_profiles_public_idx
  on public.educator_profiles(status) where published;

alter table public.educator_profiles enable row level security;
alter table public.educator_service_regions enable row level security;
alter table public.educator_service_subregions enable row level security;

-- In this phase the tables are admin-managed. The public API exposes only
-- deliberately published rows and never exposes owner_id or Wix identifiers.
revoke all on public.educator_profiles from anon, authenticated;
revoke all on public.educator_service_regions from anon, authenticated;
revoke all on public.educator_service_subregions from anon, authenticated;

create or replace function public.get_public_educators()
returns table (
  id uuid,
  full_name text,
  photo_url text,
  training text,
  additional_professions text,
  related_professions text,
  volunteer_work text,
  teaching_approach text,
  about text,
  reception_place text,
  reception_notes text,
  region_notes text,
  availability_notes text,
  online_available boolean,
  online_notes text,
  phone text,
  contact_email text,
  website_url text,
  instagram_url text,
  facebook_url text,
  other_social_url text,
  status text,
  region_ids uuid[],
  subregion_ids uuid[]
)
language sql stable security definer
set search_path = ''
as $$
  select e.id, e.full_name, e.photo_url, e.training,
    e.additional_professions, e.related_professions, e.volunteer_work,
    e.teaching_approach, e.about, e.reception_place,
    e.reception_notes, e.region_notes, e.availability_notes,
    e.online_available, e.online_notes, e.phone, e.contact_email,
    e.website_url, e.instagram_url, e.facebook_url,
    e.other_social_url, e.status,
    coalesce((select array_agg(r.region_id) from public.educator_service_regions r
      where r.educator_id = e.id), '{}'::uuid[]),
    coalesce((select array_agg(s.subregion_id) from public.educator_service_subregions s
      where s.educator_id = e.id), '{}'::uuid[])
  from public.educator_profiles e
  where e.published = true and e.status in ('active', 'paused');
$$;

revoke all on function public.get_public_educators() from public;
grant execute on function public.get_public_educators() to anon, authenticated;
