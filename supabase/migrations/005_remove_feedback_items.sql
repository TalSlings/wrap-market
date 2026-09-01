-- The launch version receives support, accessibility and privacy requests
-- through the dedicated email addresses instead of an in-site feedback form.
-- Run this migration in the Supabase SQL Editor after merging the code change.

drop table if exists public.feedback_items cascade;
