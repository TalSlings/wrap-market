-- Refines the public educator directory and replaces all imported area assignments.
-- Safe to rerun: the migration validates the full 24-row import before changing it.
begin;

alter table public.educator_profiles add column if not exists brand_name text;
alter table public.educator_profiles add column if not exists card_intro text;
alter table public.educator_profiles add column if not exists online_status text;

update public.educator_profiles
set online_status = case when online_available then 'yes' else 'no' end
where online_status is null;

alter table public.educator_profiles alter column online_status set default 'no';
alter table public.educator_profiles alter column online_status set not null;

do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'educator_profiles_online_status_check'
      and conrelid = 'public.educator_profiles'::regclass
  ) then
    alter table public.educator_profiles add constraint educator_profiles_online_status_check
      check (online_status in ('yes','special','no'));
  end if;
end
$constraints$;

create temp table imported_educator_ids (wix_id text primary key) on commit drop;
insert into imported_educator_ids(wix_id) values
('095eaddd-7077-4a19-b988-930ccef75c60'),('0deb4075-8872-4893-8a8e-15b7a396d1d6'),
('2428497b-fb1d-46b1-bb0e-46c012a147d1'),('2853b712-0185-4616-8b79-b9e58158e4bb'),
('2d9dd168-5a5f-43e6-8ea1-e3cb10426a3a'),('31ecf33c-b05e-412e-84ae-1d4ab3df57a4'),
('3e151be2-88a2-4f78-842f-248f5ab18d38'),('4095371e-a0fa-4706-872e-5bb9ba22de16'),
('454f90be-c814-47ff-931e-aa7f7376a946'),('49a6d07a-60ef-4c40-83da-f81ea8a96e44'),
('543d9a4c-2dea-49c6-ab8a-507c5b920a40'),('546dde9c-45db-4f24-856d-fe5c71b8cbed'),
('64db32ab-5f54-45f1-bd13-6c5739076af6'),('6a634891-ad16-4bef-a63f-a13c887abab9'),
('6c71a34d-3b2f-440b-ad3e-8fc4e1573e3c'),('8d6cc8c6-3f13-4145-b7c2-b071c69cfcaf'),
('a0a7d1c6-f797-4645-b54b-5b4938f38064'),('ad988f58-55e6-4f46-99d9-1743e7313805'),
('b3e0f059-3a32-4590-b7ce-3eef3d8e8101'),('c73c831c-a818-47ff-88b6-c0103f6832a4'),
('cdef2cef-968f-4219-9553-3c29de18e552'),('d806ddd8-3085-409f-945d-e399da005d5e'),
('ee09775d-7b73-431c-9263-098d2bf9fc69'),('ee2f2ec9-2c39-4833-a126-ca01881a117e');

do $validate$
declare found_count integer;
begin
  select count(*) into found_count
  from public.educator_profiles e join imported_educator_ids i on i.wix_id=e.wix_id;
  if found_count <> 24 then
    raise exception 'Expected all 24 imported educators; found %. No refinements were applied.', found_count;
  end if;
end
$validate$;

update public.educator_profiles e set
  online_status = case
    when e.wix_id in (
      '095eaddd-7077-4a19-b988-930ccef75c60','0deb4075-8872-4893-8a8e-15b7a396d1d6',
      '2428497b-fb1d-46b1-bb0e-46c012a147d1','2d9dd168-5a5f-43e6-8ea1-e3cb10426a3a',
      '3e151be2-88a2-4f78-842f-248f5ab18d38','4095371e-a0fa-4706-872e-5bb9ba22de16',
      '454f90be-c814-47ff-931e-aa7f7376a946','49a6d07a-60ef-4c40-83da-f81ea8a96e44',
      '546dde9c-45db-4f24-856d-fe5c71b8cbed','a0a7d1c6-f797-4645-b54b-5b4938f38064',
      'ad988f58-55e6-4f46-99d9-1743e7313805','c73c831c-a818-47ff-88b6-c0103f6832a4',
      'cdef2cef-968f-4219-9553-3c29de18e552','d806ddd8-3085-409f-945d-e399da005d5e'
    ) then 'yes'
    when e.wix_id in (
      '543d9a4c-2dea-49c6-ab8a-507c5b920a40',
      '64db32ab-5f54-45f1-bd13-6c5739076af6',
      'ee09775d-7b73-431c-9263-098d2bf9fc69'
    ) then 'special'
    else 'no'
  end,
  online_available = e.wix_id in (
    '095eaddd-7077-4a19-b988-930ccef75c60','0deb4075-8872-4893-8a8e-15b7a396d1d6',
    '2428497b-fb1d-46b1-bb0e-46c012a147d1','2d9dd168-5a5f-43e6-8ea1-e3cb10426a3a',
    '3e151be2-88a2-4f78-842f-248f5ab18d38','4095371e-a0fa-4706-872e-5bb9ba22de16',
    '454f90be-c814-47ff-931e-aa7f7376a946','49a6d07a-60ef-4c40-83da-f81ea8a96e44',
    '543d9a4c-2dea-49c6-ab8a-507c5b920a40','546dde9c-45db-4f24-856d-fe5c71b8cbed',
    '64db32ab-5f54-45f1-bd13-6c5739076af6','a0a7d1c6-f797-4645-b54b-5b4938f38064',
    'ad988f58-55e6-4f46-99d9-1743e7313805','c73c831c-a818-47ff-88b6-c0103f6832a4',
    'cdef2cef-968f-4219-9553-3c29de18e552','d806ddd8-3085-409f-945d-e399da005d5e',
    'ee09775d-7b73-431c-9263-098d2bf9fc69'
  ),
  updated_at = now()
from imported_educator_ids i where e.wix_id=i.wix_id;

-- Ayala now lives abroad: retain her public profile but clear stale local/reception details.
update public.educator_profiles set reception_place=null, reception_notes=null, region_notes=null, updated_at=now()
where wix_id='49a6d07a-60ef-4c40-83da-f81ea8a96e44';
update public.educator_profiles set reception_notes=null, updated_at=now()
where wix_id='64db32ab-5f54-45f1-bd13-6c5739076af6' and trim(coalesce(reception_notes,''))='¹';

delete from public.educator_service_regions r using public.educator_profiles e, imported_educator_ids i
where r.educator_id=e.id and e.wix_id=i.wix_id;
delete from public.educator_service_subregions s using public.educator_profiles e, imported_educator_ids i
where s.educator_id=e.id and e.wix_id=i.wix_id;

create temp table educator_region_map(wix_id text, region_order integer) on commit drop;
insert into educator_region_map values
('095eaddd-7077-4a19-b988-930ccef75c60',3),
('0deb4075-8872-4893-8a8e-15b7a396d1d6',5),
('2428497b-fb1d-46b1-bb0e-46c012a147d1',4),('2428497b-fb1d-46b1-bb0e-46c012a147d1',5),('2428497b-fb1d-46b1-bb0e-46c012a147d1',6),
('2853b712-0185-4616-8b79-b9e58158e4bb',1),('2853b712-0185-4616-8b79-b9e58158e4bb',2),
('31ecf33c-b05e-412e-84ae-1d4ab3df57a4',3),
('3e151be2-88a2-4f78-842f-248f5ab18d38',3),
('4095371e-a0fa-4706-872e-5bb9ba22de16',1),('4095371e-a0fa-4706-872e-5bb9ba22de16',2),
('454f90be-c814-47ff-931e-aa7f7376a946',6),
('8d6cc8c6-3f13-4145-b7c2-b071c69cfcaf',3),('8d6cc8c6-3f13-4145-b7c2-b071c69cfcaf',4),('8d6cc8c6-3f13-4145-b7c2-b071c69cfcaf',5),
('ad988f58-55e6-4f46-99d9-1743e7313805',5),
('cdef2cef-968f-4219-9553-3c29de18e552',3),('cdef2cef-968f-4219-9553-3c29de18e552',4),
('d806ddd8-3085-409f-945d-e399da005d5e',1),
('ee09775d-7b73-431c-9263-098d2bf9fc69',8);

insert into public.educator_service_regions(educator_id,region_id)
select e.id,r.id from educator_region_map m
join public.educator_profiles e on e.wix_id=m.wix_id
join public.regions r on r.sort_order=m.region_order
on conflict do nothing;

create temp table educator_subregion_map(wix_id text, region_order integer, subregion_order integer) on commit drop;
insert into educator_subregion_map values
('095eaddd-7077-4a19-b988-930ccef75c60',4,2),
('0deb4075-8872-4893-8a8e-15b7a396d1d6',4,7),('0deb4075-8872-4893-8a8e-15b7a396d1d6',6,5),('0deb4075-8872-4893-8a8e-15b7a396d1d6',6,4),
('3e151be2-88a2-4f78-842f-248f5ab18d38',1,4),('3e151be2-88a2-4f78-842f-248f5ab18d38',2,2),
('3e151be2-88a2-4f78-842f-248f5ab18d38',4,1),('3e151be2-88a2-4f78-842f-248f5ab18d38',4,2),('3e151be2-88a2-4f78-842f-248f5ab18d38',4,3),('3e151be2-88a2-4f78-842f-248f5ab18d38',4,4),('3e151be2-88a2-4f78-842f-248f5ab18d38',4,5),
('543d9a4c-2dea-49c6-ab8a-507c5b920a40',1,3),('543d9a4c-2dea-49c6-ab8a-507c5b920a40',1,4),('543d9a4c-2dea-49c6-ab8a-507c5b920a40',1,6),
('543d9a4c-2dea-49c6-ab8a-507c5b920a40',2,1),('543d9a4c-2dea-49c6-ab8a-507c5b920a40',2,2),('543d9a4c-2dea-49c6-ab8a-507c5b920a40',2,6),
('546dde9c-45db-4f24-856d-fe5c71b8cbed',4,6),('546dde9c-45db-4f24-856d-fe5c71b8cbed',4,7),('546dde9c-45db-4f24-856d-fe5c71b8cbed',5,5),('546dde9c-45db-4f24-856d-fe5c71b8cbed',5,2),('546dde9c-45db-4f24-856d-fe5c71b8cbed',5,3),
('64db32ab-5f54-45f1-bd13-6c5739076af6',1,4),('64db32ab-5f54-45f1-bd13-6c5739076af6',1,5),('64db32ab-5f54-45f1-bd13-6c5739076af6',1,6),('64db32ab-5f54-45f1-bd13-6c5739076af6',1,7),
('64db32ab-5f54-45f1-bd13-6c5739076af6',2,1),('64db32ab-5f54-45f1-bd13-6c5739076af6',2,2),('64db32ab-5f54-45f1-bd13-6c5739076af6',2,3),('64db32ab-5f54-45f1-bd13-6c5739076af6',2,6),('64db32ab-5f54-45f1-bd13-6c5739076af6',2,7),
('6a634891-ad16-4bef-a63f-a13c887abab9',6,4),
('6c71a34d-3b2f-440b-ad3e-8fc4e1573e3c',4,1),('6c71a34d-3b2f-440b-ad3e-8fc4e1573e3c',4,3),
('a0a7d1c6-f797-4645-b54b-5b4938f38064',3,3),('a0a7d1c6-f797-4645-b54b-5b4938f38064',3,4),('a0a7d1c6-f797-4645-b54b-5b4938f38064',3,5),('a0a7d1c6-f797-4645-b54b-5b4938f38064',4,2),
('b3e0f059-3a32-4590-b7ce-3eef3d8e8101',4,3),('b3e0f059-3a32-4590-b7ce-3eef3d8e8101',4,4),('b3e0f059-3a32-4590-b7ce-3eef3d8e8101',3,5),('b3e0f059-3a32-4590-b7ce-3eef3d8e8101',8,5),
('c73c831c-a818-47ff-88b6-c0103f6832a4',5,1),('c73c831c-a818-47ff-88b6-c0103f6832a4',5,3),('c73c831c-a818-47ff-88b6-c0103f6832a4',5,4),('c73c831c-a818-47ff-88b6-c0103f6832a4',8,1),('c73c831c-a818-47ff-88b6-c0103f6832a4',8,2),('c73c831c-a818-47ff-88b6-c0103f6832a4',8,3),
('ee09775d-7b73-431c-9263-098d2bf9fc69',6,5),
('ee2f2ec9-2c39-4833-a126-ca01881a117e',6,1),('ee2f2ec9-2c39-4833-a126-ca01881a117e',6,2);

insert into public.educator_service_subregions(educator_id,subregion_id)
select e.id,s.id from educator_subregion_map m
join public.educator_profiles e on e.wix_id=m.wix_id
join public.regions r on r.sort_order=m.region_order
join public.subregions s on s.region_id=r.id and s.sort_order=m.subregion_order
on conflict do nothing;

do $validate_assignments$
declare region_count integer; subregion_count integer;
begin
  select count(*) into region_count from public.educator_service_regions r
  join public.educator_profiles e on e.id=r.educator_id
  join imported_educator_ids i on i.wix_id=e.wix_id;
  select count(*) into subregion_count from public.educator_service_subregions s
  join public.educator_profiles e on e.id=s.educator_id
  join imported_educator_ids i on i.wix_id=e.wix_id;
  if region_count <> 20 or subregion_count <> 51 then
    raise exception 'Area assignment validation failed (regions %, subregions %). All changes were rolled back.',
      region_count, subregion_count;
  end if;
end
$validate_assignments$;

drop function if exists public.get_public_educators();
create function public.get_public_educators()
returns table (
  id uuid, full_name text, brand_name text, card_intro text, photo_url text,
  training text, additional_professions text, related_professions text,
  volunteer_work text, teaching_approach text, about text, reception_place text,
  reception_notes text, region_notes text, availability_notes text,
  online_available boolean, online_status text, online_notes text, contact_email text,
  website_url text, instagram_url text, facebook_url text, other_social_url text,
  status text, region_ids uuid[], subregion_ids uuid[]
)
language sql stable security definer set search_path=''
as $$
  select e.id,e.full_name,e.brand_name,e.card_intro,e.photo_url,e.training,
    e.additional_professions,e.related_professions,e.volunteer_work,e.teaching_approach,
    e.about,e.reception_place,e.reception_notes,e.region_notes,e.availability_notes,
    e.online_available,e.online_status,e.online_notes,e.contact_email,e.website_url,
    e.instagram_url,e.facebook_url,e.other_social_url,e.status,
    coalesce((select array_agg(r.region_id) from public.educator_service_regions r where r.educator_id=e.id),'{}'::uuid[]),
    coalesce((select array_agg(s.subregion_id) from public.educator_service_subregions s where s.educator_id=e.id),'{}'::uuid[])
  from public.educator_profiles e where e.published=true and e.status in ('active','paused');
$$;
revoke all on function public.get_public_educators() from public;
grant execute on function public.get_public_educators() to anon,authenticated;

create or replace function public.get_public_educator_contact(p_educator_id uuid)
returns table(phone text)
language sql stable security definer set search_path=''
as $$
  select e.phone from public.educator_profiles e
  where e.id=p_educator_id and e.published=true and e.status in ('active','paused');
$$;
revoke all on function public.get_public_educator_contact(uuid) from public;
grant execute on function public.get_public_educator_contact(uuid) to anon,authenticated;

commit;

select online_status,count(*) from public.educator_profiles
where wix_id in (
  '095eaddd-7077-4a19-b988-930ccef75c60','0deb4075-8872-4893-8a8e-15b7a396d1d6',
  '2428497b-fb1d-46b1-bb0e-46c012a147d1','2853b712-0185-4616-8b79-b9e58158e4bb',
  '2d9dd168-5a5f-43e6-8ea1-e3cb10426a3a','31ecf33c-b05e-412e-84ae-1d4ab3df57a4',
  '3e151be2-88a2-4f78-842f-248f5ab18d38','4095371e-a0fa-4706-872e-5bb9ba22de16',
  '454f90be-c814-47ff-931e-aa7f7376a946','49a6d07a-60ef-4c40-83da-f81ea8a96e44',
  '543d9a4c-2dea-49c6-ab8a-507c5b920a40','546dde9c-45db-4f24-856d-fe5c71b8cbed',
  '64db32ab-5f54-45f1-bd13-6c5739076af6','6a634891-ad16-4bef-a63f-a13c887abab9',
  '6c71a34d-3b2f-440b-ad3e-8fc4e1573e3c','8d6cc8c6-3f13-4145-b7c2-b071c69cfcaf',
  'a0a7d1c6-f797-4645-b54b-5b4938f38064','ad988f58-55e6-4f46-99d9-1743e7313805',
  'b3e0f059-3a32-4590-b7ce-3eef3d8e8101','c73c831c-a818-47ff-88b6-c0103f6832a4',
  'cdef2cef-968f-4219-9553-3c29de18e552','d806ddd8-3085-409f-945d-e399da005d5e',
  'ee09775d-7b73-431c-9263-098d2bf9fc69','ee2f2ec9-2c39-4833-a126-ca01881a117e'
) group by online_status order by online_status;
