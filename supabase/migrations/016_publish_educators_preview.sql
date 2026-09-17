-- Publishes only the 24 educator profiles imported from the former Wix directory.
do $publish_educators$
declare
  imported_ids text[] := array[
    '095eaddd-7077-4a19-b988-930ccef75c60', '0deb4075-8872-4893-8a8e-15b7a396d1d6',
    '2428497b-fb1d-46b1-bb0e-46c012a147d1', '2853b712-0185-4616-8b79-b9e58158e4bb',
    '2d9dd168-5a5f-43e6-8ea1-e3cb10426a3a', '31ecf33c-b05e-412e-84ae-1d4ab3df57a4',
    '3e151be2-88a2-4f78-842f-248f5ab18d38', '4095371e-a0fa-4706-872e-5bb9ba22de16',
    '454f90be-c814-47ff-931e-aa7f7376a946', '49a6d07a-60ef-4c40-83da-f81ea8a96e44',
    '543d9a4c-2dea-49c6-ab8a-507c5b920a40', '546dde9c-45db-4f24-856d-fe5c71b8cbed',
    '64db32ab-5f54-45f1-bd13-6c5739076af6', '6a634891-ad16-4bef-a63f-a13c887abab9',
    '6c71a34d-3b2f-440b-ad3e-8fc4e1573e3c', '8d6cc8c6-3f13-4145-b7c2-b071c69cfcaf',
    'a0a7d1c6-f797-4645-b54b-5b4938f38064', 'ad988f58-55e6-4f46-99d9-1743e7313805',
    'b3e0f059-3a32-4590-b7ce-3eef3d8e8101', 'c73c831c-a818-47ff-88b6-c0103f6832a4',
    'cdef2cef-968f-4219-9553-3c29de18e552', 'd806ddd8-3085-409f-945d-e399da005d5e',
    'ee09775d-7b73-431c-9263-098d2bf9fc69', 'ee2f2ec9-2c39-4833-a126-ca01881a117e'
  ];
  matching_count integer;
begin
  select count(*) into matching_count
  from public.educator_profiles
  where wix_id = any(imported_ids);

  if matching_count <> 24 then
    raise exception 'Expected 24 imported educator profiles; found %. Nothing was published.', matching_count;
  end if;

  update public.educator_profiles
  set published = true, status = 'active', updated_at = now()
  where wix_id = any(imported_ids)
    and published = false
    and status = 'hidden';
end;
$publish_educators$;

select count(*) as public_imported_educators
from public.educator_profiles
where wix_id in (
  '095eaddd-7077-4a19-b988-930ccef75c60', '0deb4075-8872-4893-8a8e-15b7a396d1d6',
  '2428497b-fb1d-46b1-bb0e-46c012a147d1', '2853b712-0185-4616-8b79-b9e58158e4bb',
  '2d9dd168-5a5f-43e6-8ea1-e3cb10426a3a', '31ecf33c-b05e-412e-84ae-1d4ab3df57a4',
  '3e151be2-88a2-4f78-842f-248f5ab18d38', '4095371e-a0fa-4706-872e-5bb9ba22de16',
  '454f90be-c814-47ff-931e-aa7f7376a946', '49a6d07a-60ef-4c40-83da-f81ea8a96e44',
  '543d9a4c-2dea-49c6-ab8a-507c5b920a40', '546dde9c-45db-4f24-856d-fe5c71b8cbed',
  '64db32ab-5f54-45f1-bd13-6c5739076af6', '6a634891-ad16-4bef-a63f-a13c887abab9',
  '6c71a34d-3b2f-440b-ad3e-8fc4e1573e3c', '8d6cc8c6-3f13-4145-b7c2-b071c69cfcaf',
  'a0a7d1c6-f797-4645-b54b-5b4938f38064', 'ad988f58-55e6-4f46-99d9-1743e7313805',
  'b3e0f059-3a32-4590-b7ce-3eef3d8e8101', 'c73c831c-a818-47ff-88b6-c0103f6832a4',
  'cdef2cef-968f-4219-9553-3c29de18e552', 'd806ddd8-3085-409f-945d-e399da005d5e',
  'ee09775d-7b73-431c-9263-098d2bf9fc69', 'ee2f2ec9-2c39-4833-a126-ca01881a117e'
)
and published = true
and status in ('active', 'paused');
