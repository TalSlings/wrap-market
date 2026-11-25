-- One graded dashboard for educators and managers.
-- Educators can edit only their own profile; existing marketplace admins manage all profiles.
begin;

insert into public.roles(key,label) values
  ('instructor','מדריכה'),
  ('admin','מנהלת אתר'),
  ('super_admin','מנהלת־על')
on conflict(key) do update set label=excluded.label;

alter table public.educator_profiles add column if not exists review_status text;
alter table public.educator_profiles add column if not exists review_note text;
alter table public.educator_profiles add column if not exists submitted_at timestamptz;
alter table public.educator_profiles add column if not exists reviewed_at timestamptz;
alter table public.educator_profiles add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.educator_profiles add column if not exists claim_setup_pending boolean not null default false;

update public.educator_profiles
set review_status=case when published then 'approved' else 'draft' end
where review_status is null;

alter table public.educator_profiles alter column review_status set default 'draft';
alter table public.educator_profiles alter column review_status set not null;

do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='educator_profiles_review_status_check'
      and conrelid='public.educator_profiles'::regclass
  ) then
    alter table public.educator_profiles
      add constraint educator_profiles_review_status_check
      check(review_status in ('draft','submitted','changes_requested','approved','rejected'));
  end if;
end
$constraints$;

create table if not exists public.educator_claim_codes(
  educator_id uuid primary key references public.educator_profiles(id) on delete cascade,
  code text not null check(code ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null
);
create unique index if not exists educator_claim_codes_active_code_idx
  on public.educator_claim_codes(code) where used_at is null;
alter table public.educator_claim_codes enable row level security;
revoke all on public.educator_claim_codes from anon,authenticated;

create table if not exists public.educator_claim_attempts(
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  attempts integer not null
);
alter table public.educator_claim_attempts enable row level security;
revoke all on public.educator_claim_attempts from anon,authenticated;

-- Shared by preview and confirmation, including invalid requests. Returning
-- null instead of raising on an invalid code commits the attempt counter.
create or replace function public.consume_educator_claim_attempt()
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_attempts integer;
begin
  if v_user is null then return false; end if;
  insert into public.educator_claim_attempts as a(user_id,window_started_at,attempts)
  values(v_user,statement_timestamp(),1)
  on conflict(user_id) do update set
    attempts=case when a.window_started_at<=statement_timestamp()-interval '15 minutes' then 1
      else least(a.attempts+1,11) end,
    window_started_at=case when a.window_started_at<=statement_timestamp()-interval '15 minutes'
      then statement_timestamp() else a.window_started_at end
  returning attempts into v_attempts;
  return v_attempts<=10;
end
$$;
revoke all on function public.consume_educator_claim_attempt() from public,anon,authenticated;

create or replace function public.educator_is_manager(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from public.admin_users a where a.user_id=p_user_id);
$$;
revoke all on function public.educator_is_manager(uuid) from public;
grant execute on function public.educator_is_manager(uuid) to authenticated;

insert into public.user_roles(user_id,role_id,granted_by)
select a.user_id,r.id,null from public.admin_users a
join public.roles r on r.key='admin'
on conflict do nothing;

insert into public.user_roles(user_id,role_id,granted_by)
select e.owner_id,r.id,null from public.educator_profiles e
join public.roles r on r.key='instructor'
where e.owner_id is not null and e.review_status='approved'
on conflict do nothing;

create or replace function public.get_my_dashboard_context()
returns jsonb language sql stable security definer set search_path=''
as $$
  select jsonb_build_object(
    'is_manager',public.educator_is_manager(auth.uid()),
    'is_instructor',exists(
      select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id
      where ur.user_id=auth.uid() and r.key='instructor'
    ),
    'has_educator_profile',exists(
      select 1 from public.educator_profiles e where e.owner_id=auth.uid()
    ),
    'educator_review_status',(
      select e.review_status from public.educator_profiles e where e.owner_id=auth.uid()
    )
  );
$$;
revoke all on function public.get_my_dashboard_context() from public;
grant execute on function public.get_my_dashboard_context() to authenticated;

create or replace function public.get_my_educator_workspace()
returns jsonb language sql stable security definer set search_path=''
as $$
  select to_jsonb(e) - 'owner_id' - 'wix_id' || jsonb_build_object(
    'region_ids',coalesce((select jsonb_agg(r.region_id order by r.region_id)
      from public.educator_service_regions r where r.educator_id=e.id),'[]'::jsonb),
    'subregion_ids',coalesce((select jsonb_agg(s.subregion_id order by s.subregion_id)
      from public.educator_service_subregions s where s.educator_id=e.id),'[]'::jsonb)
  )
  from public.educator_profiles e where e.owner_id=auth.uid();
$$;
revoke all on function public.get_my_educator_workspace() from public;
grant execute on function public.get_my_educator_workspace() to authenticated;

create or replace function public.preview_educator_claim(p_code text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_preview jsonb;
begin
  if not public.consume_educator_claim_attempt() then return null; end if;
  if exists(select 1 from public.educator_profiles where owner_id=auth.uid()) then return null; end if;
  select jsonb_build_object('id',e.id,'full_name',e.full_name,'brand_name',e.brand_name)
    into v_preview
  from public.educator_claim_codes c
  join public.educator_profiles e on e.id=c.educator_id
  where c.code=trim(p_code) and c.used_at is null
    and c.created_at>statement_timestamp()-interval '7 days'
    and e.owner_id is null and e.published and e.status in ('active','paused');
  return v_preview;
end
$$;
revoke all on function public.preview_educator_claim(text) from public;
grant execute on function public.preview_educator_claim(text) to authenticated;

-- Replace any older one-argument endpoint so it cannot bypass the preview ID.
drop function if exists public.claim_educator_profile(text);
create or replace function public.claim_educator_profile(p_code text,p_educator_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_educator uuid;
begin
  if not public.consume_educator_claim_attempt() then return null; end if;
  if exists(select 1 from public.educator_profiles where owner_id=v_user) then
    raise exception 'כבר קיים כרטיס מדריכה שמקושר לחשבון הזה';
  end if;
  perform 1 from public.educator_profiles where id=p_educator_id and owner_id is null
    and published and status in ('active','paused') for update;
  if not found then return null; end if;
  select c.educator_id into v_educator from public.educator_claim_codes c
  join public.educator_profiles e on e.id=c.educator_id
  where c.code=trim(p_code) and c.educator_id=p_educator_id and c.used_at is null
    and c.created_at>statement_timestamp()-interval '7 days'
    and e.owner_id is null and e.published and e.status in ('active','paused')
  for update of c;
  if v_educator is null then return null; end if;

  update public.educator_profiles set owner_id=v_user,review_status='approved',
    claim_setup_pending=true,review_note=null,reviewed_at=now(),reviewed_by=v_user,updated_at=now()
  where id=v_educator;
  update public.educator_claim_codes set used_at=now(),used_by=v_user
  where educator_id=v_educator;
  insert into public.user_roles(user_id,role_id,granted_by)
  select v_user,r.id,v_user from public.roles r where r.key='instructor'
  on conflict do nothing;
  return v_educator;
end
$$;
revoke all on function public.claim_educator_profile(text,uuid) from public;
grant execute on function public.claim_educator_profile(text,uuid) to authenticated;

create or replace function public.save_my_educator_profile(
  p_profile jsonb,p_region_ids uuid[] default '{}'::uuid[],p_subregion_ids uuid[] default '{}'::uuid[]
) returns uuid language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid:=auth.uid(); v_id uuid; v_review text; v_status text; v_setup boolean;
  v_name text:=nullif(trim(coalesce(p_profile->>'full_name','')),'');
  v_online text:=coalesce(nullif(p_profile->>'online_status',''),'no');
begin
  if v_user is null then raise exception 'נדרשת התחברות'; end if;
  if v_name is null then raise exception 'צריך למלא שם'; end if;
  if v_online not in ('yes','special','no') then raise exception 'מצב האונליין אינו תקין'; end if;

  select id,review_status,status,claim_setup_pending into v_id,v_review,v_status,v_setup from public.educator_profiles
  where owner_id=v_user for update;
  if v_id is null then
    insert into public.educator_profiles(owner_id,full_name,review_status,status,published)
    values(v_user,v_name,'draft','hidden',false) returning id,review_status into v_id,v_review;
  end if;
  v_status:=case when v_review<>'approved' or v_status='hidden' then 'hidden'
    when p_profile->>'status'='paused' then 'paused' else 'active' end;

  if v_setup then
    if nullif(trim(p_profile->>'card_intro'),'') is null or not (
      exists(select 1 from public.regions where active and id=any(p_region_ids))
      or exists(select 1 from public.subregions where active and id=any(p_subregion_ids))
      or v_online<>'no'
    ) then raise exception 'צריך להוסיף משפט קצר ולבחור אזור שירות או הדרכה אונליין'; end if;
    -- The first save confirms only the existing regions and the short intro.
    update public.educator_profiles set card_intro=trim(p_profile->>'card_intro'),
      online_status=v_online,online_available=(v_online<>'no'),
      claim_setup_pending=false,updated_at=now() where id=v_id and owner_id=v_user;
  else

  update public.educator_profiles set
    full_name=v_name,brand_name=nullif(trim(p_profile->>'brand_name'),''),
    card_intro=nullif(trim(p_profile->>'card_intro'),''),
    training=nullif(trim(p_profile->>'training'),''),
    additional_professions=nullif(trim(p_profile->>'additional_professions'),''),
    related_professions=nullif(trim(p_profile->>'related_professions'),''),
    volunteer_work=nullif(trim(p_profile->>'volunteer_work'),''),
    teaching_approach=nullif(trim(p_profile->>'teaching_approach'),''),
    about=nullif(trim(p_profile->>'about'),''),reception_place=nullif(trim(p_profile->>'reception_place'),''),
    reception_notes=nullif(trim(p_profile->>'reception_notes'),''),
    region_notes=nullif(trim(p_profile->>'region_notes'),''),
    availability_notes=nullif(trim(p_profile->>'availability_notes'),''),
    online_status=v_online,online_available=(v_online<>'no'),
    online_notes=nullif(trim(p_profile->>'online_notes'),''),phone=nullif(trim(p_profile->>'phone'),''),
    contact_email=nullif(trim(p_profile->>'contact_email'),''),website_url=nullif(trim(p_profile->>'website_url'),''),
    instagram_url=nullif(trim(p_profile->>'instagram_url'),''),facebook_url=nullif(trim(p_profile->>'facebook_url'),''),
    other_social_url=nullif(trim(p_profile->>'other_social_url'),''),status=v_status,
    updated_at=now()
  where id=v_id and owner_id=v_user;
  end if;

  delete from public.educator_service_regions where educator_id=v_id;
  insert into public.educator_service_regions(educator_id,region_id)
  select v_id,r.id from public.regions r
  where r.active and r.id=any(coalesce(p_region_ids,'{}'::uuid[])) on conflict do nothing;
  delete from public.educator_service_subregions where educator_id=v_id;
  insert into public.educator_service_subregions(educator_id,subregion_id)
  select v_id,s.id from public.subregions s
  where s.active and s.id=any(coalesce(p_subregion_ids,'{}'::uuid[])) on conflict do nothing;
  return v_id;
end
$$;
revoke all on function public.save_my_educator_profile(jsonb,uuid[],uuid[]) from public;
grant execute on function public.save_my_educator_profile(jsonb,uuid[],uuid[]) to authenticated;

create or replace function public.submit_my_educator_profile()
returns void language plpgsql security definer set search_path=''
as $$
declare v_profile public.educator_profiles%rowtype;
begin
  select * into v_profile from public.educator_profiles where owner_id=auth.uid() for update;
  if v_profile.id is null then raise exception 'לא נמצאה טיוטת מדריכה'; end if;
  if nullif(trim(coalesce(v_profile.card_intro,'')),'') is null then
    raise exception 'צריך להוסיף משפט קצר שמציג אותך';
  end if;
  if not exists(select 1 from public.educator_service_regions where educator_id=v_profile.id)
    and not exists(select 1 from public.educator_service_subregions where educator_id=v_profile.id)
    and v_profile.online_status='no' then
    raise exception 'צריך לבחור אזור שירות או הדרכה אונליין';
  end if;
  if v_profile.review_status<>'approved' then
    update public.educator_profiles set review_status='submitted',submitted_at=now(),
      review_note=null,updated_at=now() where id=v_profile.id;
  end if;
end
$$;
revoke all on function public.submit_my_educator_profile() from public;
grant execute on function public.submit_my_educator_profile() to authenticated;

create or replace function public.get_admin_educator_workspace()
returns jsonb language sql stable security definer set search_path=''
as $$
  select case when public.educator_is_manager(auth.uid()) then coalesce(jsonb_agg(
    to_jsonb(e) - 'wix_id' || jsonb_build_object(
      'owner_email',(select u.email from auth.users u where u.id=e.owner_id),
      'claim_code',(select c.code from public.educator_claim_codes c
        where c.educator_id=e.id and c.used_at is null and c.created_at>now()-interval '7 days'),
      'region_ids',coalesce((select jsonb_agg(r.region_id) from public.educator_service_regions r
        where r.educator_id=e.id),'[]'::jsonb),
      'subregion_ids',coalesce((select jsonb_agg(s.subregion_id) from public.educator_service_subregions s
        where s.educator_id=e.id),'[]'::jsonb)
    ) order by (e.review_status='submitted') desc,e.full_name
  ),'[]'::jsonb) else '[]'::jsonb end
  from public.educator_profiles e;
$$;
revoke all on function public.get_admin_educator_workspace() from public;
grant execute on function public.get_admin_educator_workspace() to authenticated;

create or replace function public.admin_save_educator_profile(
  p_educator_id uuid,p_profile jsonb,p_region_ids uuid[] default '{}'::uuid[],
  p_subregion_ids uuid[] default '{}'::uuid[]
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid:=p_educator_id; v_name text:=nullif(trim(coalesce(p_profile->>'full_name','')),'');
  v_online text:=coalesce(nullif(p_profile->>'online_status',''),'no'); v_existing public.educator_profiles%rowtype;
begin
  if not public.educator_is_manager(auth.uid()) then raise exception 'אין הרשאת ניהול'; end if;
  if v_name is null then raise exception 'צריך למלא שם'; end if;
  if v_online not in ('yes','special','no') then raise exception 'מצב האונליין אינו תקין'; end if;
  if v_id is null then
    insert into public.educator_profiles(full_name,review_status,status,published,reviewed_at,reviewed_by)
    values(v_name,'approved','active',true,now(),auth.uid()) returning id into v_id;
  end if;
  select * into v_existing from public.educator_profiles where id=v_id for update;
  if v_existing.id is null then raise exception 'כרטיס המדריכה לא נמצא'; end if;

  update public.educator_profiles set
    full_name=v_name,brand_name=nullif(trim(p_profile->>'brand_name'),''),
    card_intro=nullif(trim(p_profile->>'card_intro'),''),photo_url=nullif(trim(p_profile->>'photo_url'),''),
    training=nullif(trim(p_profile->>'training'),''),
    additional_professions=nullif(trim(p_profile->>'additional_professions'),''),
    related_professions=nullif(trim(p_profile->>'related_professions'),''),
    volunteer_work=nullif(trim(p_profile->>'volunteer_work'),''),
    teaching_approach=nullif(trim(p_profile->>'teaching_approach'),''),about=nullif(trim(p_profile->>'about'),''),
    reception_place=nullif(trim(p_profile->>'reception_place'),''),
    reception_notes=nullif(trim(p_profile->>'reception_notes'),''),region_notes=nullif(trim(p_profile->>'region_notes'),''),
    availability_notes=nullif(trim(p_profile->>'availability_notes'),''),online_status=v_online,
    online_available=(v_online<>'no'),online_notes=nullif(trim(p_profile->>'online_notes'),''),
    phone=nullif(trim(p_profile->>'phone'),''),contact_email=nullif(trim(p_profile->>'contact_email'),''),
    website_url=nullif(trim(p_profile->>'website_url'),''),instagram_url=nullif(trim(p_profile->>'instagram_url'),''),
    facebook_url=nullif(trim(p_profile->>'facebook_url'),''),other_social_url=nullif(trim(p_profile->>'other_social_url'),''),
    status=case when p_profile->>'status'='paused' then 'paused'
      when p_profile->>'status'='hidden' then 'hidden' else 'active' end,updated_at=now()
  where id=v_id;
  delete from public.educator_service_regions where educator_id=v_id;
  insert into public.educator_service_regions(educator_id,region_id)
  select v_id,r.id from public.regions r where r.active and r.id=any(coalesce(p_region_ids,'{}'::uuid[]))
  on conflict do nothing;
  delete from public.educator_service_subregions where educator_id=v_id;
  insert into public.educator_service_subregions(educator_id,subregion_id)
  select v_id,s.id from public.subregions s where s.active and s.id=any(coalesce(p_subregion_ids,'{}'::uuid[]))
  on conflict do nothing;
  return v_id;
end
$$;
revoke all on function public.admin_save_educator_profile(uuid,jsonb,uuid[],uuid[]) from public;
grant execute on function public.admin_save_educator_profile(uuid,jsonb,uuid[],uuid[]) to authenticated;

create or replace function public.admin_review_educator(
  p_educator_id uuid,p_action text,p_note text default null
) returns void language plpgsql security definer set search_path=''
as $$
declare v_owner uuid;
begin
  if not public.educator_is_manager(auth.uid()) then raise exception 'אין הרשאת ניהול'; end if;
  select owner_id into v_owner from public.educator_profiles where id=p_educator_id for update;
  if not found then raise exception 'כרטיס המדריכה לא נמצא'; end if;
  if p_action='approve' then
    update public.educator_profiles set review_status='approved',review_note=null,published=true,
      status=case when status='paused' then 'paused' else 'active' end,
      reviewed_at=now(),reviewed_by=auth.uid(),updated_at=now() where id=p_educator_id;
    if v_owner is not null then
      insert into public.user_roles(user_id,role_id,granted_by)
      select v_owner,r.id,auth.uid() from public.roles r where r.key='instructor'
      on conflict do nothing;
    end if;
  elsif p_action='changes' then
    update public.educator_profiles set review_status='changes_requested',review_note=nullif(trim(p_note),''),
      reviewed_at=now(),reviewed_by=auth.uid(),updated_at=now() where id=p_educator_id;
  elsif p_action='reject' then
    update public.educator_profiles set review_status='rejected',review_note=nullif(trim(p_note),''),
      published=false,status='hidden',reviewed_at=now(),reviewed_by=auth.uid(),updated_at=now()
      where id=p_educator_id;
  elsif p_action='pause' then
    update public.educator_profiles set status='paused',updated_at=now() where id=p_educator_id;
  elsif p_action='activate' then
    update public.educator_profiles set status='active',published=true,updated_at=now() where id=p_educator_id;
  elsif p_action='hide' then
    update public.educator_profiles set status='hidden',published=false,updated_at=now() where id=p_educator_id;
  else raise exception 'פעולת הניהול אינה תקינה';
  end if;
end
$$;
revoke all on function public.admin_review_educator(uuid,text,text) from public;
grant execute on function public.admin_review_educator(uuid,text,text) to authenticated;

create or replace function public.admin_regenerate_educator_claim_code(p_educator_id uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare v_code text; v_owner uuid; v_eligible boolean;
begin
  if not public.educator_is_manager(auth.uid()) then raise exception 'אין הרשאת ניהול'; end if;
  -- Lock the profile before updating its code; claim takes the same lock order.
  select owner_id,published and status in ('active','paused') into v_owner,v_eligible
  from public.educator_profiles where id=p_educator_id for update;
  if not found then raise exception 'כרטיס המדריכה לא נמצא'; end if;
  if v_owner is not null then raise exception 'הכרטיס כבר מקושר לחשבון'; end if;
  if not v_eligible then raise exception 'אפשר להפיק קוד רק לכרטיס שמוצג במאגר'; end if;
  delete from public.educator_claim_codes where educator_id=p_educator_id
    or (used_at is null and created_at<=now()-interval '7 days');
  for i in 1..100 loop
    v_code:=lpad((('x'||left(gen_random_uuid()::text,8))::bit(32)::bigint % 10000)::text,4,'0');
    insert into public.educator_claim_codes(educator_id,code,created_by)
    values(p_educator_id,v_code,auth.uid()) on conflict do nothing;
    if found then return v_code; end if;
  end loop;
  raise exception 'לא הצלחנו להפיק קוד כרגע; אפשר לנסות שוב';
end
$$;
revoke all on function public.admin_regenerate_educator_claim_code(uuid) from public;
grant execute on function public.admin_regenerate_educator_claim_code(uuid) to authenticated;

create or replace function public.admin_link_educator_to_email(p_educator_id uuid,p_email text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_user uuid; v_existing_owner uuid;
begin
  if not public.educator_is_manager(auth.uid()) then raise exception 'אין הרשאת ניהול'; end if;
  select u.id into v_user from auth.users u where lower(u.email)=lower(trim(p_email)) limit 1;
  if v_user is null then raise exception 'לא נמצאה משתמשת עם כתובת המייל הזו'; end if;
  select owner_id into v_existing_owner from public.educator_profiles where id=p_educator_id for update;
  if not found then raise exception 'כרטיס המדריכה לא נמצא'; end if;
  if v_existing_owner is not null and v_existing_owner<>v_user then raise exception 'הכרטיס כבר מחובר למשתמשת אחרת'; end if;
  if exists(select 1 from public.educator_profiles where owner_id=v_user and id<>p_educator_id) then
    raise exception 'למשתמשת הזו כבר מחובר כרטיס מדריכה אחר';
  end if;
  update public.educator_profiles set owner_id=v_user,review_status='approved',review_note=null,
    published=true,status=case when status='paused' then 'paused' else 'active' end,
    reviewed_at=now(),reviewed_by=auth.uid(),updated_at=now() where id=p_educator_id;
  update public.educator_claim_codes set used_at=now(),used_by=v_user
    where educator_id=p_educator_id and used_at is null;
  insert into public.user_roles(user_id,role_id,granted_by)
  select v_user,r.id,auth.uid() from public.roles r where r.key='instructor'
  on conflict do nothing;
end
$$;
revoke all on function public.admin_link_educator_to_email(uuid,text) from public;
grant execute on function public.admin_link_educator_to_email(uuid,text) to authenticated;

commit;

select review_status,count(*) from public.educator_profiles group by review_status order by review_status;
