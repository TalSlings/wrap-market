-- Adds the additional Wix educator as one published profile.
-- Rerunnable: an existing matching source record is never overwritten.
begin;

do $check_name$
begin
  if exists (
    select 1 from public.educator_profiles
    where lower(trim(full_name))=lower('מיכל זונדלביץ')
      and wix_id is distinct from '69b3e504-c222-4d52-8e97-4af2a768c84e'
  ) then
    raise exception 'An educator named מיכל זונדלביץ already exists under another source ID. Nothing was changed.';
  end if;
end
$check_name$;

insert into public.educator_profiles (
  wix_id, full_name, training, related_professions, teaching_approach, about,
  reception_place, availability_notes, online_available, online_status, online_notes,
  phone, contact_email, instagram_url, status, published
) values (
  '69b3e504-c222-4d52-8e97-4af2a768c84e',
  'מיכל זונדלביץ',
  'קלאו ווי 1',
  'מאמנת להתפתחות אישית בשיטת סאטיה | מלווה להתפתחות תינוקות',
  $text$הלוואי והיינו לומדות את כישורי הנשיאה בתוך הקהילה שאנחנו חיות בה. שנוכל לגדל תינוקות קרוב אלינו פיזית בלי פחד ממה יגידו.
אני מאמינה שנשיאה היא כלי עזר להורות בקצת יותר קלות❤️$text$,
  $text$שלום
אני מיכל
אמא של תבל בת 3 וגילי בת 8 חודשים. הילדות גדלות בחינוך ביתי$text$,
  'בביתי בקריית טבעון ובבית המשפחה בקריית טבעון והסביבה',
  $text$גמישה
כולל שישי ושבת$text$,
  true,
  'special',
  'רק משפחות שעברו הדרכה וזקוקות לדיוקים',
  '0526135947',
  'Michal.zundelevich@gmail.com',
  'https://www.instagram.com/michal.zundelevich?stkn=MTl4N2ZoNmxqcGVocg==',
  'active',
  true
)
on conflict (wix_id) do nothing;

insert into public.educator_service_subregions(educator_id,subregion_id)
select e.id,s.id
from public.educator_profiles e
join public.regions r on r.sort_order=2
join public.subregions s on s.region_id=r.id and s.sort_order=6
where e.wix_id='69b3e504-c222-4d52-8e97-4af2a768c84e'
on conflict do nothing;

do $validate$
declare profile_count integer; area_count integer;
begin
  select count(*) into profile_count
  from public.educator_profiles
  where wix_id='69b3e504-c222-4d52-8e97-4af2a768c84e'
    and published=true and status='active' and online_status='special';

  select count(*) into area_count
  from public.educator_profiles e
  join public.educator_service_subregions es on es.educator_id=e.id
  join public.subregions s on s.id=es.subregion_id
  join public.regions r on r.id=s.region_id
  where e.wix_id='69b3e504-c222-4d52-8e97-4af2a768c84e'
    and r.sort_order=2 and s.sort_order=6;

  if profile_count<>1 or area_count<>1 then
    raise exception 'Michal import validation failed (profile %, area %). All changes were rolled back.',
      profile_count,area_count;
  end if;
end
$validate$;

commit;

select e.full_name,e.status,e.published,e.online_status,s.name as service_subregion
from public.educator_profiles e
join public.educator_service_subregions es on es.educator_id=e.id
join public.subregions s on s.id=es.subregion_id
where e.wix_id='69b3e504-c222-4d52-8e97-4af2a768c84e';

