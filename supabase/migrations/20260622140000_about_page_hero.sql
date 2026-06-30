-- About Us hero section image/text was hardcoded in lib/hero.ts with no admin
-- path — adding override columns to the about_page singleton so it can be
-- edited the same way Play Area's hero already is.
alter table about_page
  add column if not exists hero_title text,
  add column if not exists hero_description text,
  add column if not exists hero_image text;
