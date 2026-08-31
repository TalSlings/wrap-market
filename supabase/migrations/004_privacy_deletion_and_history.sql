-- Preserve only the fact that an account has listing history after the listing
-- content itself is permanently deleted. This controls the 30-month inactivity
-- period without retaining the deleted ad.
create table if not exists public.account_listing_history (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_listing_at timestamptz not null default now()
);

alter table public.account_listing_history enable row level security;

insert into public.account_listing_history(user_id, first_listing_at)
select owner_id, min(created_at)
from public.listings
group by owner_id
on conflict(user_id) do nothing;

create or replace function public.remember_listing_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.account_listing_history(user_id, first_listing_at)
  values(new.owner_id, coalesce(new.created_at, now()))
  on conflict(user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists remember_listing_history_on_insert on public.listings;
create trigger remember_listing_history_on_insert
after insert on public.listings
for each row execute procedure public.remember_listing_history();
