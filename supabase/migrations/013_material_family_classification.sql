-- Make the top-level material family the single source of truth for natural,
-- vegan and easy-care classifications. Safe to run more than once.

drop trigger if exists propagate_material_family_flags_trigger on public.materials;
drop trigger if exists inherit_material_family_flags_trigger on public.materials;

create or replace function public.inherit_material_family_flags()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  family_vegan boolean;
  family_easycare boolean;
  family_origin text;
begin
  if new.parent_material_id is not null then
    with recursive ancestors as (
      select id, parent_material_id, vegan, easycare, material_origin
      from public.materials
      where id = new.parent_material_id

      union all

      select parent.id, parent.parent_material_id, parent.vegan,
             parent.easycare, parent.material_origin
      from public.materials parent
      join ancestors child on parent.id = child.parent_material_id
    )
    select vegan, easycare, material_origin
    into family_vegan, family_easycare, family_origin
    from ancestors
    order by (parent_material_id is null) desc
    limit 1;

    new.vegan := coalesce(family_vegan, new.vegan);
    new.easycare := coalesce(family_easycare, new.easycare);
    new.material_origin := coalesce(family_origin, new.material_origin);
  else
    new.vegan := trim(new.name) not in (
      'משי', 'צמר', 'שיער בעלי חיים', 'שיער בע"ח', 'שיער בע״ח', 'סיבים מן החי'
    );

    if trim(new.name) in (
      'כותנה', 'פשתן', 'שונות טבעי', 'סיבים טבעיים נוספים',
      'משי', 'צמר', 'שיער בעלי חיים', 'שיער בע"ח', 'שיער בע״ח', 'סיבים מן החי'
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

-- Repair every existing top-level family first.
update public.materials
set material_origin = case
  when trim(name) in (
    'כותנה', 'פשתן', 'שונות טבעי', 'סיבים טבעיים נוספים',
    'משי', 'צמר', 'שיער בעלי חיים', 'שיער בע"ח', 'שיער בע״ח', 'סיבים מן החי'
  ) then 'natural'
  when material_origin = 'natural' then 'other'
  else material_origin
end,
vegan = trim(name) not in (
  'משי', 'צמר', 'שיער בעלי חיים', 'שיער בע"ח', 'שיער בע״ח', 'סיבים מן החי'
)
where parent_material_id is null;

-- This is a separate statement so it uses the repaired origin above.
update public.materials
set easycare = trim(name) = 'כותנה' or material_origin = 'synthetic'
where parent_material_id is null;

-- Then copy those classifications to every descendant, at any nesting depth.
with recursive material_family as (
  select id, vegan as family_vegan, easycare as family_easycare,
         material_origin as family_origin
  from public.materials
  where parent_material_id is null

  union all

  select child.id, family.family_vegan, family.family_easycare,
         family.family_origin
  from public.materials child
  join material_family family on child.parent_material_id = family.id
)
update public.materials material
set vegan = family.family_vegan,
    easycare = family.family_easycare,
    material_origin = family.family_origin
from material_family family
where material.id = family.id
  and material.parent_material_id is not null;

create trigger inherit_material_family_flags_trigger
before insert or update of parent_material_id, material_origin, name, vegan, easycare
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

create trigger propagate_material_family_flags_trigger
after update of vegan, easycare, material_origin
on public.materials
for each row execute procedure public.propagate_material_family_flags();
