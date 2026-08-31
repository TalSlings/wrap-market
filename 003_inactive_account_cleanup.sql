-- Tracks warnings and deletion dates for inactive accounts.
-- The service-role-only daily job reads and writes this table.
create table if not exists public.account_cleanup_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_activity_at timestamptz not null,
  deletion_scheduled_at timestamptz not null,
  has_listing_history boolean not null,
  warning_30_sent_at timestamptz,
  warning_7_sent_at timestamptz,
  warning_3_sent_at timestamptz,
  warning_1_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_cleanup_state enable row level security;

create index if not exists account_cleanup_scheduled_idx
  on public.account_cleanup_state(deletion_scheduled_at);

-- A short-lived retry queue makes it possible to send the confirmation only
-- after Auth confirms that the account was deleted. Successful messages are
-- removed immediately from this table.
create table if not exists public.account_deletion_email_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text not null,
  ready_to_send boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.account_deletion_email_queue enable row level security;
