-- Live-launch fixes: repair the material classifications used by listing badges
-- and keep child materials aligned with their selected family.
-- Safe to run more than once.

-- All synthetic fibres are easy-care. Cotton and every material below cotton
-- are easy-care too. Other families stay false unless an administrator changes
-- the family classification later.
with recursive cotton_family as (
  select id
  from public.materials
  where parent_material_id is null and trim(name) = 'כותנה'

  union all

  select child.id
  from public.materials child
  join cotton_family parent on child.parent_material_id = parent.id
)
update public.materials material
set easycare = (
  material.material_origin = 'synthetic'
  or material.id in (select id from cotton_family)
);

-- Only animal-origin families and all of their descendants are non-vegan.
update public.materials set vegan = true;

with recursive animal_family as (
  select id
  from public.materials
  where parent_material_id is null
    and trim(name) in ('משי', 'צמר', 'שיער בעלי חיים', 'סיבים מן החי')

  union all

  select child.id
  from public.materials child
  join animal_family parent on child.parent_material_id = parent.id
)
update public.materials
set vegan = false
where id in (select id from animal_family);

create or replace function public.inherit_material_family_flags()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_vegan boolean;
  parent_easycare boolean;
begin
  if new.parent_material_id is not null then
    select vegan, easycare
    into parent_vegan, parent_easycare
    from public.materials
    where id = new.parent_material_id;

    new.vegan := coalesce(parent_vegan, new.vegan);
    new.easycare := coalesce(parent_easycare, new.easycare);
  elsif new.material_origin = 'synthetic' then
    new.easycare := true;
  end if;

  return new;
end;
$$;

drop trigger if exists inherit_material_family_flags_trigger on public.materials;
create trigger inherit_material_family_flags_trigger
before insert or update of parent_material_id, material_origin
on public.materials
for each row execute procedure public.inherit_material_family_flags();

create or replace function public.propagate_material_family_flags()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.materials
  set vegan = new.vegan,
      easycare = new.easycare
  where parent_material_id = new.id
    and (vegan is distinct from new.vegan or easycare is distinct from new.easycare);

  return new;
end;
$$;

drop trigger if exists propagate_material_family_flags_trigger on public.materials;
create trigger propagate_material_family_flags_trigger
after update of vegan, easycare
on public.materials
for each row execute procedure public.propagate_material_family_flags();

create index if not exists listing_images_listing_kind_position_idx
on public.listing_images(listing_id, image_type, position);
