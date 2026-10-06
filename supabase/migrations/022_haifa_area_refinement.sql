-- Splits the former "זכרון יעקב וחוף הכרמל" option and expands אזור חיפה.
-- Existing selections of the combined option are preserved in both resulting areas.
begin;

do $refine_haifa_area$
declare
  v_region uuid;
  v_old_combined uuid;
  v_zichron uuid;
  v_pardes_hanna uuid;
  v_count integer;
begin
  select id into v_region from public.regions where sort_order=2 for update;
  if v_region is null then
    raise exception 'אזור חיפה (sort_order 2) לא נמצא';
  end if;

  update public.regions set name='אזור חיפה' where id=v_region;

  select id into v_old_combined
  from public.subregions
  where region_id=v_region and (name='זכרון יעקב וחוף הכרמל' or name='חוף הכרמל')
  order by case when name='חוף הכרמל' then 1 else 0 end desc
  limit 1;
  if v_old_combined is null then
    raise exception 'תת־האזור הישן זכרון יעקב וחוף הכרמל לא נמצא';
  end if;

  update public.subregions set name='חוף הכרמל',sort_order=3,active=true
  where id=v_old_combined;

  insert into public.subregions(region_id,name,sort_order,active)
  values(v_region,'זכרון יעקב, בנימינה וגבעת עדה',4,true)
  on conflict(region_id,name) do update set sort_order=excluded.sort_order,active=true
  returning id into v_zichron;

  insert into public.subregions(region_id,name,sort_order,active)
  values(v_region,'פרדס חנה–כרכור',5,true)
  on conflict(region_id,name) do update set sort_order=excluded.sort_order,active=true
  returning id into v_pardes_hanna;

  update public.subregions set name='קיסריה ואור עקיבא',sort_order=6,active=true
  where region_id=v_region and name in ('קיסריה','קיסריה ואור עקיבא');
  update public.subregions set name='חדרה והסביבה',sort_order=7,active=true
  where region_id=v_region and name in ('חדרה','חדרה והסביבה');
  update public.subregions set sort_order=8,active=true
  where region_id=v_region and name='טבעון ויקנעם';
  update public.subregions set sort_order=9,active=true
  where region_id=v_region and name='רמות מנשה';

  -- A former combined selection meant either part. Keep both until the owner
  -- chooses a more precise area during a future edit.
  insert into public.educator_service_subregions(educator_id,subregion_id)
  select e.educator_id,v_zichron
  from public.educator_service_subregions e
  where e.subregion_id=v_old_combined
  on conflict do nothing;

  insert into public.listing_locations(listing_id,region_id,subregion_id)
  select distinct l.listing_id,l.region_id,v_zichron
  from public.listing_locations l
  where l.subregion_id=v_old_combined
    and not exists(
      select 1 from public.listing_locations already
      where already.listing_id=l.listing_id and already.subregion_id=v_zichron
    );

  -- Preserve personal default locations in whichever profile table exists.
  if exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='user_profiles' and column_name='subregion_ids') then
    execute format(
      'update public.user_profiles set subregion_ids=array_append(subregion_ids,%L::uuid)
       where %L::uuid=any(subregion_ids) and not (%L::uuid=any(subregion_ids))',
      v_zichron,v_old_combined,v_zichron
    );
  elsif exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='default_subregion_ids') then
    execute format(
      'update public.profiles set default_subregion_ids=array_append(default_subregion_ids,%L::uuid)
       where %L::uuid=any(default_subregion_ids) and not (%L::uuid=any(default_subregion_ids))',
      v_zichron,v_old_combined,v_zichron
    );
  end if;

  -- A saved search using the former combined option should keep finding both parts.
  update public.saved_searches
  set filters=jsonb_set(
    filters,
    '{subs}',
    coalesce(filters->'subs','[]'::jsonb) || to_jsonb(v_zichron::text),
    true
  )
  where coalesce(filters->'subs','[]'::jsonb) ? v_old_combined::text
    and not (coalesce(filters->'subs','[]'::jsonb) ? v_zichron::text);

  select count(*) into v_count from public.subregions
  where region_id=v_region and active=true and name in (
    'חיפה','הקריות','חוף הכרמל','זכרון יעקב, בנימינה וגבעת עדה',
    'פרדס חנה–כרכור','קיסריה ואור עקיבא','חדרה והסביבה',
    'טבעון ויקנעם','רמות מנשה'
  );
  if v_count<>9 then
    raise exception 'אימות אזור חיפה נכשל: נמצאו % מתוך 9 תתי־אזורים',v_count;
  end if;
end
$refine_haifa_area$;

commit;

select r.name as region,s.sort_order,s.name as subregion
from public.regions r join public.subregions s on s.region_id=r.id
where r.sort_order=2 and s.active=true order by s.sort_order;
