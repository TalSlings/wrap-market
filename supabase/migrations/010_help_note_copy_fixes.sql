-- Run once in Supabase SQL Editor after uploading this update.
-- Safe to run more than once.

update public.help_notes
set content = 'שם היצרן באותיות לטיניות.',
    updated_at = now()
where section_key = 'manufacturer_add'
  and placement = 'form';

update public.help_notes
set content = E'טבעי — הסיב גדל בצורתו כסיב, למשל כותנה או צמר.\nמלאכותי — מקור טבעי שעובד לסיב.\nסינתטי — סיב שמיוצר מפולימרים, למשל פוליאסטר או ניילון.\nאחר — כשלא ברור לאיזה סוג החומר שייך.',
    updated_at = now()
where section_key = 'material_origin'
  and placement = 'form';
