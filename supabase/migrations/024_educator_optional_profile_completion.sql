-- A card can be claimed and edited without completing suggested fields.
-- New cards still need manager approval to be published. Requires migration 021.
begin;

-- Keep the existing column for compatibility with earlier dashboard builds.
-- This clears the old onboarding flag only; ownership and public content are unchanged.
update public.educator_profiles
set claim_setup_pending=false
where claim_setup_pending;

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
    claim_setup_pending=false,review_note=null,reviewed_at=now(),reviewed_by=v_user,updated_at=now()
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
  v_user uuid:=auth.uid(); v_id uuid; v_review text; v_status text;
  v_name text:=nullif(trim(coalesce(p_profile->>'full_name','')),'');
  v_online text:=coalesce(nullif(p_profile->>'online_status',''),'no');
begin
  if v_user is null then raise exception 'נדרשת התחברות'; end if;
  if v_name is null then raise exception 'צריך למלא שם'; end if;
  if v_online not in ('yes','special','no') then raise exception 'מצב האונליין אינו תקין'; end if;

  select id,review_status,status into v_id,v_review,v_status from public.educator_profiles
  where owner_id=v_user for update;
  if v_id is null then
    insert into public.educator_profiles(owner_id,full_name,review_status,status,published)
    values(v_user,v_name,'draft','hidden',false) returning id,review_status into v_id,v_review;
  end if;
  v_status:=case when v_review<>'approved' or v_status='hidden' then 'hidden'
    when p_profile->>'status'='paused' then 'paused' else 'active' end;

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
  if v_profile.review_status<>'approved' then
    update public.educator_profiles set review_status='submitted',submitted_at=now(),
      review_note=null,updated_at=now() where id=v_profile.id;
  end if;
end
$$;
revoke all on function public.submit_my_educator_profile() from public;
grant execute on function public.submit_my_educator_profile() to authenticated;

commit;

select count(*) as profiles_waiting_for_required_setup
from public.educator_profiles where claim_setup_pending;
