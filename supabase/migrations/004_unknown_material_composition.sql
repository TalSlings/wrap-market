alter table public.listings
  add column if not exists material_composition_unknown boolean not null default false;
