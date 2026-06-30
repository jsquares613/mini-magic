-- =============================================================================
-- Mini Magic — Row Level Security (Architecture v2.1 §2.9)
-- Model: public reads the catalogue; public may INSERT enquiries; staff
-- (profiles.role in admin/editor) manage everything; only admins manage roles.
-- =============================================================================

-- Role helpers. SECURITY DEFINER so they read `profiles` without triggering
-- the RLS on `profiles` itself (prevents infinite recursion in policies).
create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role in ('admin', 'editor')
  );
$$;

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- Public-read / staff-write content tables (same pattern → applied in a loop)
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'categories','age_groups','products','product_age_groups','product_images',
    'product_related','category_promotions','homepage_hero_slides','homepage_sections',
    'homepage_featured_products','promotional_banners','play_area','play_area_gallery',
    'play_area_packages','play_area_features','about_page','about_statistics',
    'team_members','testimonials','contact_information','business_hours',
    'navigation_links','social_links','site_settings','seo_pages','redirects'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      $p$create policy "public_read_%1$s" on %1$I for select to anon, authenticated using (true);$p$, t);
    execute format(
      $p$create policy "staff_write_%1$s" on %1$I for all to authenticated using (is_staff()) with check (is_staff());$p$, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Enquiries: public may submit (insert); only staff may read/update/delete.
-- -----------------------------------------------------------------------------
alter table enquiries enable row level security;
create policy "enquiries_public_insert" on enquiries
  for insert to anon, authenticated with check (true);
create policy "enquiries_staff_all" on enquiries
  for all to authenticated using (is_staff()) with check (is_staff());

-- Enquiry notes + audit log: staff only.
alter table enquiry_notes enable row level security;
create policy "enquiry_notes_staff_all" on enquiry_notes
  for all to authenticated using (is_staff()) with check (is_staff());

alter table audit_log enable row level security;
create policy "audit_log_staff_all" on audit_log
  for all to authenticated using (is_staff()) with check (is_staff());

-- -----------------------------------------------------------------------------
-- Profiles: a user can read their own row; admins manage all roles.
-- -----------------------------------------------------------------------------
alter table profiles enable row level security;
create policy "profiles_self_read" on profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_admin_all" on profiles
  for all to authenticated using (is_admin()) with check (is_admin());
