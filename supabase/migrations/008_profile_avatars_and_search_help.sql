-- Run once in Supabase SQL Editor after uploading this update.
-- Safe to run more than once.

alter table public.user_profiles
  add column if not exists avatar_key text not null default 'pawn-01';

update public.user_profiles
set avatar_key = 'pawn-01'
where avatar_key not in (
  'pawn-01','pawn-02','pawn-03','pawn-04','pawn-05','pawn-06',
  'pawn-07','pawn-08','pawn-09','pawn-10','pawn-11','pawn-12'
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_profiles'::regclass
      and conname = 'user_profiles_avatar_key_check'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_avatar_key_check
      check (avatar_key in (
        'pawn-01','pawn-02','pawn-03','pawn-04','pawn-05','pawn-06',
        'pawn-07','pawn-08','pawn-09','pawn-10','pawn-11','pawn-12'
      ));
  end if;
end $$;

insert into public.help_notes
  (section_key, section_label, placement, content, is_visible)
values
  ('gsm', 'GSM', 'search', 'אפשר לכלול בתוצאות גם מודעות שבהן ה־GSM לא ידוע.', true),
  ('condition', 'מצב המנשא', 'search', E'לא היה בשימוש — המנשא לא כובס, לא נוסה ולא נלבש. עדיין במצב שבו נמכר.\nהיה קצת בשימוש — המנשא כובס או נמדד, אבל לא נעשה בו שימוש.\nהיה בשימוש אך עדיין לא התרכך — המנשא היה בשימוש תקופה, אבל עדיין לא התרכך.\nמרוכך — המנשא עבר שימוש מספיק כדי להיות רך ונוח לקשירה.\nמעט בלוי — המנשא כבר שחוק, רך מדי או גמיש.\nבלוי — קיימים סימני שימוש ובלאי משמעותיים.', true),
  ('color_pattern_single_color', 'תכונת צבע — צבע יחיד', 'search', null, false),
  ('color_pattern_two_color_positive_negative', 'תכונת צבע — שני צבעים / נגטיב', 'search', null, false),
  ('color_pattern_stripes_ombre_symmetric', 'תכונת צבע — פסים או אומברה סימטריים', 'search', null, false),
  ('color_pattern_stripes_ombre_asymmetric', 'תכונת צבע — פסים או אומברה לא סימטריים', 'search', null, false),
  ('color_pattern_rainbow', 'תכונת צבע — קשת', 'search', null, false)
on conflict (section_key, placement) do update
set section_label = excluded.section_label,
    content = excluded.content,
    is_visible = excluded.is_visible,
    updated_at = now();

update public.help_notes
set content = null,
    is_visible = false,
    updated_at = now()
where section_key = 'size'
  and placement = 'search';
