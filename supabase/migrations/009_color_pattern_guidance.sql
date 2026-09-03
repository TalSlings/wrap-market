-- Run once in Supabase SQL Editor after uploading this update.
-- Safe to run more than once.

insert into public.help_notes
  (section_key, section_label, placement, content, is_visible)
values
  (
    'color_patterns',
    'תכונות צבע',
    'search',
    'אפשר לבחור יותר מתכונת צבע אחת. חלק מהתכונות עיצוביות, ואחרות יכולות לעזור בלימוד ההידוק ובזיהוי היפוך בבד.',
    true
  ),
  ('color_pattern_single_color', 'תכונת צבע — צבע חלק', 'search', 'עיצובי', true),
  ('color_pattern_two_color_positive_negative', 'תכונת צבע — דו צדדי', 'search', 'עוזר ללמוד קשירות ומקל על זיהוי היפוך בבד', true),
  ('color_pattern_stripes_ombre_symmetric', 'תכונת צבע — פסים סימטרי', 'search', 'עוזר ללמוד להדק סיב אחרי סיב, אבל לא נותן אינדיקציה להיפוכים בבד', true),
  ('color_pattern_stripes_ombre_asymmetric', 'תכונת צבע — פסים אסימטרי', 'search', 'עוזר ללמוד להדק סיב אחרי סיב, וגם לזהות את ההיפוכים בבד', true),
  ('color_pattern_rainbow', 'תכונת צבע — קשת', 'search', 'עיצובי', true),
  ('color_pattern_multicolor', 'תכונת צבע — רב גוני', 'search', 'עיצובי', true)
on conflict (section_key, placement) do update
set section_label = excluded.section_label,
    content = excluded.content,
    is_visible = excluded.is_visible,
    updated_at = now();
