-- Connects the supplied educator photos to existing published profiles.
-- Run after migrations 018 and 019. No profile is created by this migration.
begin;

with primary_photos(wix_id,image_url) as (values
  ('4095371e-a0fa-4706-872e-5bb9ba22de16','/educators/dana-novikov.jpg'),
  ('3e151be2-88a2-4f78-842f-248f5ab18d38','/educators/yael-globman-1.jpeg'),
  ('454f90be-c814-47ff-931e-aa7f7376a946','/educators/moria-yadgar.jpg'),
  ('a0a7d1c6-f797-4645-b54b-5b4938f38064','/educators/michelle-seri.jpeg'),
  ('2d9dd168-5a5f-43e6-8ea1-e3cb10426a3a','/educators/shi-karmel-popliger.jpeg'),
  ('095eaddd-7077-4a19-b988-930ccef75c60','/educators/shiran-maor-1.jpg'),
  ('0deb4075-8872-4893-8a8e-15b7a396d1d6','/educators/shani-hearter.jpg'),
  ('c73c831c-a818-47ff-88b6-c0103f6832a4','/educators/dorin-alush-dabah.webp'),
  ('546dde9c-45db-4f24-856d-fe5c71b8cbed','/educators/gela-ibinder.jpg'),
  ('543d9a4c-2dea-49c6-ab8a-507c5b920a40','/educators/yulia-rabinovich.jpeg'),
  ('ee09775d-7b73-431c-9263-098d2bf9fc69','/educators/maya-peretz.jpg'),
  ('69b3e504-c222-4d52-8e97-4af2a768c84e','/educators/michal-zundelevich.png'),
  ('cdef2cef-968f-4219-9553-3c29de18e552','/educators/noa-zondi-shapira.png'),
  ('2428497b-fb1d-46b1-bb0e-46c012a147d1','/educators/elisheva-gurevich.jpg'),
  ('ad988f58-55e6-4f46-99d9-1743e7313805','/educators/eden-kedem.jpg'),
  ('6a634891-ad16-4bef-a63f-a13c887abab9','/educators/tzivi-perkel.jpg'),
  ('64db32ab-5f54-45f1-bd13-6c5739076af6','/educators/tal-sharabi-shir.jpg')
)
update public.educator_profiles e
set photo_url=p.image_url,updated_at=now()
from primary_photos p
where e.wix_id=p.wix_id;

with gallery_photos(wix_id,image_url,alt_text,sort_order) as (values
  ('4095371e-a0fa-4706-872e-5bb9ba22de16','/educators/dana-novikov.jpg','דנה נוביקוב',0),
  ('3e151be2-88a2-4f78-842f-248f5ab18d38','/educators/yael-globman-1.jpeg','יעל גלובמן',0),
  ('3e151be2-88a2-4f78-842f-248f5ab18d38','/educators/yael-globman-2.jpeg','יעל גלובמן',1),
  ('454f90be-c814-47ff-931e-aa7f7376a946','/educators/moria-yadgar.jpg','מוריה ידגר',0),
  ('a0a7d1c6-f797-4645-b54b-5b4938f38064','/educators/michelle-seri.jpeg','מישל סרי',0),
  ('2d9dd168-5a5f-43e6-8ea1-e3cb10426a3a','/educators/shi-karmel-popliger.jpeg','שי כרמל פופליגר',0),
  ('095eaddd-7077-4a19-b988-930ccef75c60','/educators/shiran-maor-1.jpg','שירן מאור',0),
  ('095eaddd-7077-4a19-b988-930ccef75c60','/educators/shiran-maor-2.jpg','שירן מאור',1),
  ('0deb4075-8872-4893-8a8e-15b7a396d1d6','/educators/shani-hearter.jpg','שני הארטר',0),
  ('c73c831c-a818-47ff-88b6-c0103f6832a4','/educators/dorin-alush-dabah.webp','דורין אלוש-דבח',0),
  ('546dde9c-45db-4f24-856d-fe5c71b8cbed','/educators/gela-ibinder.jpg','גלה איבינדר',0),
  ('543d9a4c-2dea-49c6-ab8a-507c5b920a40','/educators/yulia-rabinovich.jpeg','יוליה רבינוביץ',0),
  ('ee09775d-7b73-431c-9263-098d2bf9fc69','/educators/maya-peretz.jpg','מאיה פרץ',0),
  ('69b3e504-c222-4d52-8e97-4af2a768c84e','/educators/michal-zundelevich.png','מיכל זונדלביץ',0),
  ('cdef2cef-968f-4219-9553-3c29de18e552','/educators/noa-zondi-shapira.png','נועה זונדי שפירא',0),
  ('2428497b-fb1d-46b1-bb0e-46c012a147d1','/educators/elisheva-gurevich.jpg','אלישבע גורביץ',0),
  ('ad988f58-55e6-4f46-99d9-1743e7313805','/educators/eden-kedem.jpg','עדן קדם',0),
  ('6a634891-ad16-4bef-a63f-a13c887abab9','/educators/tzivi-perkel.jpg','ציבי פרקל',0),
  ('64db32ab-5f54-45f1-bd13-6c5739076af6','/educators/tal-sharabi-shir.jpg','טל שרעבי שיר',0)
)
insert into public.educator_profile_images(educator_id,image_url,alt_text,sort_order,published)
select e.id,g.image_url,g.alt_text,g.sort_order,true
from gallery_photos g
join public.educator_profiles e on e.wix_id=g.wix_id
on conflict(educator_id,sort_order) do update
set image_url=excluded.image_url,alt_text=excluded.alt_text,published=true,updated_at=now();

do $validate$
declare primary_count integer; gallery_count integer;
begin
  with expected(wix_id,image_url) as (values
    ('4095371e-a0fa-4706-872e-5bb9ba22de16','/educators/dana-novikov.jpg'),
    ('3e151be2-88a2-4f78-842f-248f5ab18d38','/educators/yael-globman-1.jpeg'),
    ('454f90be-c814-47ff-931e-aa7f7376a946','/educators/moria-yadgar.jpg'),
    ('a0a7d1c6-f797-4645-b54b-5b4938f38064','/educators/michelle-seri.jpeg'),
    ('2d9dd168-5a5f-43e6-8ea1-e3cb10426a3a','/educators/shi-karmel-popliger.jpeg'),
    ('095eaddd-7077-4a19-b988-930ccef75c60','/educators/shiran-maor-1.jpg'),
    ('0deb4075-8872-4893-8a8e-15b7a396d1d6','/educators/shani-hearter.jpg'),
    ('c73c831c-a818-47ff-88b6-c0103f6832a4','/educators/dorin-alush-dabah.webp'),
    ('546dde9c-45db-4f24-856d-fe5c71b8cbed','/educators/gela-ibinder.jpg'),
    ('543d9a4c-2dea-49c6-ab8a-507c5b920a40','/educators/yulia-rabinovich.jpeg'),
    ('ee09775d-7b73-431c-9263-098d2bf9fc69','/educators/maya-peretz.jpg'),
    ('69b3e504-c222-4d52-8e97-4af2a768c84e','/educators/michal-zundelevich.png'),
    ('cdef2cef-968f-4219-9553-3c29de18e552','/educators/noa-zondi-shapira.png'),
    ('2428497b-fb1d-46b1-bb0e-46c012a147d1','/educators/elisheva-gurevich.jpg'),
    ('ad988f58-55e6-4f46-99d9-1743e7313805','/educators/eden-kedem.jpg'),
    ('6a634891-ad16-4bef-a63f-a13c887abab9','/educators/tzivi-perkel.jpg'),
    ('64db32ab-5f54-45f1-bd13-6c5739076af6','/educators/tal-sharabi-shir.jpg')
  )
  select count(*) into primary_count from expected x
  join public.educator_profiles e on e.wix_id=x.wix_id and e.photo_url=x.image_url;

  with expected(wix_id,sort_order,image_url) as (values
    ('4095371e-a0fa-4706-872e-5bb9ba22de16',0,'/educators/dana-novikov.jpg'),
    ('3e151be2-88a2-4f78-842f-248f5ab18d38',0,'/educators/yael-globman-1.jpeg'),
    ('3e151be2-88a2-4f78-842f-248f5ab18d38',1,'/educators/yael-globman-2.jpeg'),
    ('454f90be-c814-47ff-931e-aa7f7376a946',0,'/educators/moria-yadgar.jpg'),
    ('a0a7d1c6-f797-4645-b54b-5b4938f38064',0,'/educators/michelle-seri.jpeg'),
    ('2d9dd168-5a5f-43e6-8ea1-e3cb10426a3a',0,'/educators/shi-karmel-popliger.jpeg'),
    ('095eaddd-7077-4a19-b988-930ccef75c60',0,'/educators/shiran-maor-1.jpg'),
    ('095eaddd-7077-4a19-b988-930ccef75c60',1,'/educators/shiran-maor-2.jpg'),
    ('0deb4075-8872-4893-8a8e-15b7a396d1d6',0,'/educators/shani-hearter.jpg'),
    ('c73c831c-a818-47ff-88b6-c0103f6832a4',0,'/educators/dorin-alush-dabah.webp'),
    ('546dde9c-45db-4f24-856d-fe5c71b8cbed',0,'/educators/gela-ibinder.jpg'),
    ('543d9a4c-2dea-49c6-ab8a-507c5b920a40',0,'/educators/yulia-rabinovich.jpeg'),
    ('ee09775d-7b73-431c-9263-098d2bf9fc69',0,'/educators/maya-peretz.jpg'),
    ('69b3e504-c222-4d52-8e97-4af2a768c84e',0,'/educators/michal-zundelevich.png'),
    ('cdef2cef-968f-4219-9553-3c29de18e552',0,'/educators/noa-zondi-shapira.png'),
    ('2428497b-fb1d-46b1-bb0e-46c012a147d1',0,'/educators/elisheva-gurevich.jpg'),
    ('ad988f58-55e6-4f46-99d9-1743e7313805',0,'/educators/eden-kedem.jpg'),
    ('6a634891-ad16-4bef-a63f-a13c887abab9',0,'/educators/tzivi-perkel.jpg'),
    ('64db32ab-5f54-45f1-bd13-6c5739076af6',0,'/educators/tal-sharabi-shir.jpg')
  )
  select count(*) into gallery_count from expected x
  join public.educator_profiles e on e.wix_id=x.wix_id
  join public.educator_profile_images i on i.educator_id=e.id
    and i.sort_order=x.sort_order and i.image_url=x.image_url and i.published=true;

  if primary_count<>17 or gallery_count<>19 then
    raise exception 'Educator photo validation failed (primary %, gallery %). All changes were rolled back.',
      primary_count,gallery_count;
  end if;
end
$validate$;

commit;

select 17 as profiles_with_primary_photos,19 as gallery_photo_records;

