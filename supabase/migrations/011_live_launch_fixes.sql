-- Live-launch fixes: repair the material classifications used by listing badges
-- and keep every subcategory aligned with its top-level material family.
-- Safe to run more than once.

-- A top-level family is natural only when it is one of the agreed families.
-- Older and newer catalogue labels are both included.
update public.materials
set material_origin = case
  when trim(name) in (
    'כותנה',
    'פשתן',
    'שונות טבעי',
    'סיבים טבעיים נוספים',
    'משי',
    'צמר',
    'שיער בעלי חיים',
    'שיער בע"ח',
    'סיבים מן החי'
  ) then 'natural'
  when material_origin = 'natural' then 'other'
  else material_origin
end,
vegan = trim(name) not in (
  'משי',
  'צמר',
  'שיער בעלי חיים',
  'שיער בע"ח',
  'סיבים מן החי'
)
where parent_material_id is null;

-- Every descendant inherits natural/artificial/synthetic and vegan from its
-- top-level family. This covers merino and any depth of nested subcategories.
with recursive material_family as (
  select id, vegan as family_vegan, material_origin as family_origin
  from public.materials
  where parent_material_id is null

  union all

  select child.id, family.family_vegan, family.family_origin
  from public.materials child
  join material_family family on child.parent_material_id = family.id
)
update public.materials material
set vegan = family.family_vegan,
    material_origin = family.family_origin
from material_family family
where material.id = family.id;

-- Easy-care belongs to the cotton family and to synthetic families.
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

create or replace function public.inherit_material_family_flags()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_vegan boolean;
  parent_easycare boolean;
  parent_origin text;
begin
  if new.parent_material_id is not null then
    select vegan, easycare, material_origin
    into parent_vegan, parent_easycare, parent_origin
    from public.materials
    where id = new.parent_material_id;

    new.vegan := coalesce(parent_vegan, new.vegan);
    new.easycare := coalesce(parent_easycare, new.easycare);
    new.material_origin := coalesce(parent_origin, new.material_origin);
  else
    new.vegan := trim(new.name) not in (
      'משי', 'צמר', 'שיער בעלי חיים', 'שיער בע"ח', 'סיבים מן החי'
    );

    if trim(new.name) in (
      'כותנה', 'פשתן', 'שונות טבעי', 'סיבים טבעיים נוספים',
      'משי', 'צמר', 'שיער בעלי חיים', 'שיער בע"ח', 'סיבים מן החי'
    ) then
      new.material_origin := 'natural';
    elsif new.material_origin = 'natural' then
      new.material_origin := 'other';
    end if;

    new.easycare := trim(new.name) = 'כותנה'
      or new.material_origin = 'synthetic';
  end if;

  return new;
end;
$$;

drop trigger if exists inherit_material_family_flags_trigger on public.materials;
create trigger inherit_material_family_flags_trigger
before insert or update of parent_material_id, material_origin, name
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
      easycare = new.easycare,
      material_origin = new.material_origin
  where parent_material_id = new.id
    and (
      vegan is distinct from new.vegan
      or easycare is distinct from new.easycare
      or material_origin is distinct from new.material_origin
    );

  return new;
end;
$$;

drop trigger if exists propagate_material_family_flags_trigger on public.materials;
create trigger propagate_material_family_flags_trigger
after update of vegan, easycare, material_origin
on public.materials
for each row execute procedure public.propagate_material_family_flags();

create index if not exists listing_images_listing_kind_position_idx
on public.listing_images(listing_id, image_type, position);
