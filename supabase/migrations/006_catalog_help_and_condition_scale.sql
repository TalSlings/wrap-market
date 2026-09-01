-- Safe to run more than once. Adds the new condition level and aligns material
-- classifications with the rules shown in the marketplace.

do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.listings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%condition%'
  loop
    execute format('alter table public.listings drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.listings
  add constraint listings_condition_check
  check (condition in ('','unused','lightly_used','used_not_broken_in','broken_in','lightly_worn','worn'));

alter table public.materials add column if not exists easycare boolean not null default false;
alter table public.materials add column if not exists is_selectable boolean not null default true;

do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.materials'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%material_origin%'
  loop
    execute format('alter table public.materials drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.materials
  add constraint materials_origin_check
  check (material_origin in ('natural','artificial','synthetic','other'));

update public.materials
set name = 'סיבים טבעיים נוספים'
where trim(name) = 'שונות טבעי';

update public.materials set easycare = false;

with recursive easycare_tree as (
  select id from public.materials where parent_material_id is null and trim(name) in ('כותנה','סינתטיים')
  union all
  select child.id from public.materials child join easycare_tree parent on child.parent_material_id = parent.id
)
update public.materials set easycare = true where id in (select id from easycare_tree);

update public.materials set vegan = true;

with recursive animal_tree as (
  select id from public.materials where parent_material_id is null and trim(name) in ('משי','צמר','שיער בעלי חיים','סיבים מן החי')
  union all
  select child.id from public.materials child join animal_tree parent on child.parent_material_id = parent.id
)
update public.materials set vegan = false where id in (select id from animal_tree);


