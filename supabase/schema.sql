-- =============================================================================
-- Mini Magic — Complete Supabase Schema (Architecture v2.1)
--
-- Run this ONCE, top-to-bottom, in the Supabase SQL Editor on a FRESH project.
-- No manual edits required. After this, run seed.sql.
--
-- Contains: extensions, enums, tables, constraints, foreign keys, indexes,
-- triggers, functions, RLS policies, and Storage bucket setup.
--
-- Catalogue + lead-generation site (no checkout/cart). See docs/ARCHITECTURE.md.
-- =============================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- =============================================================================
-- 1. ENUMERATED TYPES
-- =============================================================================
create type price_display      as enum ('show', 'hide', 'enquire');
create type enquiry_type       as enum ('product', 'play_area', 'contact', 'general');
create type enquiry_status     as enum ('new', 'contacted', 'in_progress', 'converted', 'lost');
create type enquiry_channel    as enum ('web_form', 'whatsapp', 'phone', 'email');
create type contact_preference as enum ('phone', 'whatsapp', 'email', 'any');
create type audit_action       as enum ('insert', 'update', 'delete');
create type nav_location       as enum ('header', 'footer_quick', 'footer_category');
create type user_role          as enum ('admin', 'editor', 'viewer');

-- =============================================================================
-- 2. CATALOGUE TABLES
-- =============================================================================

-- Categories (subcategories deferred for launch — no parent_id; see ARCHITECTURE.md v2.1)
create table categories (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  emoji           text,
  color           text,
  image           text,
  banner_image    text,
  featured        boolean not null default false,
  display_order   int not null default 0,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index categories_featured_idx on categories (featured) where featured;

-- Controlled, admin-managed age brackets for faceted product filtering
create table age_groups (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  slug        text not null unique,
  min_age     int,
  max_age     int,
  sort_order  int not null default 0
);

-- Products: price is nullable (supports Hide Price / Enquire for Price);
-- sale_price is the ONLY real discount mechanism. `available` replaces a
-- multi-state stock_status (catalogue site, not checkout/inventory system).
create table products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  sku               text unique,
  short_description text,
  description       text,
  category_id       uuid not null references categories(id) on delete restrict,
  price             numeric(10,2),
  price_display     price_display not null default 'show',
  sale_price        numeric(10,2),
  material          text,
  color             text,
  available         boolean not null default true,
  tags              text[] not null default '{}',
  features          text[] not null default '{}',
  popular           boolean not null default false,
  new_arrival       boolean not null default false,
  display_order     int not null default 0,
  seo_title         text,
  seo_description   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint products_sale_price_chk check (sale_price is null or price is null or sale_price <= price)
);
create index products_category_idx    on products (category_id);
create index products_popular_idx     on products (popular)     where popular;
create index products_new_arrival_idx on products (new_arrival) where new_arrival;
create index products_sale_price_idx  on products (sale_price)  where sale_price is not null;

-- Product ↔ age groups (M:N — a toy can suit multiple brackets)
create table product_age_groups (
  product_id   uuid not null references products(id) on delete cascade,
  age_group_id uuid not null references age_groups(id) on delete restrict,
  primary key (product_id, age_group_id)
);
create index product_age_groups_age_idx on product_age_groups (age_group_id);

-- Product image gallery (multiple images per product, one marked primary)
create table product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  image_url   text not null,
  alt_text    text,
  is_primary  boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index product_images_product_idx on product_images (product_id);
create unique index one_primary_per_product on product_images (product_id) where is_primary;

-- Curated "related products" (M:N self-relation); UI falls back to same-category
-- products when a product has no curated relations.
create table product_related (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references products(id) on delete cascade,
  related_product_id uuid not null references products(id) on delete cascade,
  sort_order         int not null default 0,
  unique (product_id, related_product_id),
  constraint product_related_no_self check (product_id <> related_product_id)
);

-- Category promotions = BANNER / MARKETING CONTENT ONLY.
-- Does NOT compute or apply any product discount — real discounts live on
-- products.sale_price. badge_text is display copy (e.g. "Up to 40% Off").
create table category_promotions (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references categories(id) on delete cascade,
  title         text not null,
  badge_text    text,
  description   text,
  image         text,
  link          text,
  active        boolean not null default true,
  starts_at     timestamptz,
  ends_at       timestamptz,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);
create index category_promotions_category_idx on category_promotions (category_id);

-- =============================================================================
-- 3. HOMEPAGE TABLES
-- =============================================================================

-- starts_at/ends_at support scheduled activation (e.g. seasonal campaigns)
create table homepage_hero_slides (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  subtitle      text,
  description   text,
  image         text,
  button_text   text,
  button_link   text,
  display_order int not null default 0,
  active        boolean not null default true,
  starts_at     timestamptz,
  ends_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Manually-curated, explicitly-ordered featured products for the homepage
-- (the SOLE "featured" mechanism — products has no featured column, v2.1)
create table homepage_featured_products (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  sort_order  int not null default 0,
  unique (product_id)
);

-- Promotional banners (the "40% Off / Explore" homepage blocks). Display only.
create table promotional_banners (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  subtitle      text,
  badge_text    text,
  image         text,
  link          text,
  active        boolean not null default true,
  starts_at     timestamptz,
  ends_at       timestamptz,
  display_order int not null default 0
);

-- Offers page hero banner. Singleton row, image-only (no overlay text).
create table offer_banner (
  id            int primary key default 1 check (id = 1),
  image         text,
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- =============================================================================
-- 4. PLAY AREA TABLES
-- =============================================================================

-- Singleton config row (id fixed to 1)
create table play_area (
  id               int primary key default 1 check (id = 1),
  hero_image       text,
  hero_title       text,
  hero_description text,
  timings          jsonb not null default '[]',  -- [{label, value}]
  pricing          jsonb not null default '[]',  -- [{label, value}]
  rules            text[] not null default '{}',
  seo_title        text,
  seo_description  text,
  updated_at       timestamptz not null default now()
);

create table play_area_gallery (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  alt_text    text,
  sort_order  int not null default 0
);

create table play_area_features (   -- trust badges (supervised, sanitised…)
  id          uuid primary key default gen_random_uuid(),
  icon        text,
  title       text not null,
  description text,
  sort_order  int not null default 0
);

-- =============================================================================
-- 5. ABOUT / TEAM / TESTIMONIALS TABLES
-- =============================================================================

create table about_page (   -- singleton
  id               int primary key default 1 check (id = 1),
  story            text,
  story_title      text,
  story_image      text,
  mission          text,
  vision           text,
  values_text      text,
  gallery          jsonb not null default '[]',  -- [{image, label}]
  hero_title       text,
  hero_description text,
  hero_image       text,
  seo_title        text,
  seo_description  text,
  updated_at       timestamptz not null default now()
);

create table about_statistics (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  value       numeric not null,
  suffix      text,   -- '+', '★', '%'
  sort_order  int not null default 0
);

create table team_members (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  designation   text,
  image         text,
  bio           text,
  display_order int not null default 0,
  active        boolean not null default true
);

create table testimonials (
  id            uuid primary key default gen_random_uuid(),
  author_name   text not null,
  author_role   text,
  quote         text not null,
  rating        int check (rating between 1 and 5),
  image         text,
  active        boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

-- =============================================================================
-- 6. GLOBAL / SETTINGS / OPERATIONS TABLES
-- =============================================================================

create table contact_information (   -- singleton
  id         int primary key default 1 check (id = 1),
  phone      text,
  whatsapp   text,   -- drives WhatsApp deep-link enquiry CTAs
  email      text,
  address    text,
  map_url    text,
  updated_at timestamptz not null default now()
);

create table business_hours (
  id          uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6),  -- 0 = Sunday
  opens_at    time,
  closes_at   time,
  is_closed   boolean not null default false,
  note        text,
  unique (day_of_week)
);

create table navigation_links (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  url           text not null,
  location      nav_location not null,   -- header | footer_quick | footer_category
  display_order int not null default 0,
  active        boolean not null default true
);

create table social_links (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null,   -- facebook, instagram, …
  url         text not null,
  icon        text,
  sort_order  int not null default 0,
  active      boolean not null default true
);

-- Free-form global settings: announcements[], footer_text, brand, etc.
create table site_settings (
  key   text primary key,
  value jsonb not null
);

-- SEO for STATIC pages (per-entity SEO lives on products/categories rows)
create table seo_pages (
  id               uuid primary key default gen_random_uuid(),
  page_key         text not null unique,   -- home | offers | play-area | about | contact | categories
  meta_title       text,
  meta_description text,
  keywords         text[] not null default '{}',
  og_image         text,
  canonical        text,
  updated_at       timestamptz not null default now()
);

-- Preserves SEO/inbound links when a product/category slug changes
create table redirects (
  id           uuid primary key default gen_random_uuid(),
  from_path    text not null unique,
  to_path      text not null,
  is_permanent boolean not null default true,
  created_at   timestamptz not null default now()
);

-- =============================================================================
-- 7. AUTH PROFILES + ENQUIRIES (lead-management core)
-- =============================================================================

-- Joins Supabase auth.users; drives RLS via role
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

-- The lead/enquiry CRM core: assignment, notes, status workflow, attribution,
-- conversion tracking. Supports product, play-area and general enquiries.
create table enquiries (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  phone             text not null,
  email             text,
  preferred_contact contact_preference not null default 'any',
  channel           enquiry_channel not null default 'web_form',
  enquiry_type      enquiry_type not null default 'general',
  product_id        uuid references products(id) on delete set null,
  subject           text,
  message           text,
  preferred_date    date,
  children_count    int,
  status            enquiry_status not null default 'new',
  assigned_to       uuid references profiles(id) on delete set null,
  contacted_at      timestamptz,
  converted_at      timestamptz,
  outcome_reason    text,
  estimated_value   numeric(10,2),
  source_page       text,
  referrer          text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  metadata          jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index enquiries_status_idx   on enquiries (status, created_at desc);
create index enquiries_assigned_idx on enquiries (assigned_to);
create index enquiries_type_idx     on enquiries (enquiry_type);
create index enquiries_product_idx  on enquiries (product_id);

-- Follow-up activity timeline per enquiry
create table enquiry_notes (
  id         uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries(id) on delete cascade,
  note       text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index enquiry_notes_enquiry_idx on enquiry_notes (enquiry_id, created_at);

-- Who changed what (multi-staff accountability)
create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  action      audit_action not null,
  table_name  text not null,
  row_id      text,
  diff        jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_table_idx on audit_log (table_name, created_at desc);

-- Anonymous, device-scoped wishlist. No customer auth exists on the
-- storefront, so shoppers are identified by an opaque client-generated
-- device_id (cookie-persisted uuid) instead of auth.uid().
create table wishlist_items (
  id         uuid primary key default gen_random_uuid(),
  device_id  uuid not null,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (device_id, product_id)
);
create index wishlist_items_device_idx on wishlist_items (device_id);

-- =============================================================================
-- 8. FUNCTIONS + TRIGGERS
-- =============================================================================

-- Auto-touch updated_at on every UPDATE
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger t_categories_touch  before update on categories           for each row execute function touch_updated_at();
create trigger t_products_touch    before update on products             for each row execute function touch_updated_at();
create trigger t_hero_touch        before update on homepage_hero_slides for each row execute function touch_updated_at();
create trigger t_play_area_touch   before update on play_area            for each row execute function touch_updated_at();
create trigger t_about_touch       before update on about_page           for each row execute function touch_updated_at();
create trigger t_contact_touch     before update on contact_information  for each row execute function touch_updated_at();
create trigger t_seo_pages_touch   before update on seo_pages            for each row execute function touch_updated_at();
create trigger t_enquiries_touch   before update on enquiries            for each row execute function touch_updated_at();
create trigger t_offer_banner_touch before update on offer_banner        for each row execute function touch_updated_at();

-- Auto-create a profile row for every new auth user (default role: viewer).
-- Promote the first admin manually after signing up, e.g.:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================================================
-- 9. ROW LEVEL SECURITY
--
-- Model: public (anon) can READ the catalogue/content; public can INSERT
-- enquiries only (no public read of leads); staff (profiles.role in
-- admin/editor) can manage all content + enquiries; only admins manage roles.
-- =============================================================================

-- Role helpers. SECURITY DEFINER so they read `profiles` without triggering
-- RLS on `profiles` itself (avoids infinite recursion in policies).
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

-- Public-read / staff-write content tables (same pattern, applied in a loop)
do $$
declare t text;
begin
  foreach t in array array[
    'categories','age_groups','products','product_age_groups','product_images',
    'product_related','category_promotions','homepage_hero_slides',
    'homepage_featured_products','promotional_banners','play_area','play_area_gallery',
    'play_area_features','about_page','about_statistics',
    'team_members','testimonials','contact_information','business_hours',
    'navigation_links','social_links','site_settings','seo_pages','redirects','offer_banner'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      $p$create policy "public_read_%1$s" on %1$I for select to anon, authenticated using (true);$p$, t);
    execute format(
      $p$create policy "staff_write_%1$s" on %1$I for all to authenticated using (is_staff()) with check (is_staff());$p$, t);
  end loop;
end $$;

-- Enquiries: public may submit (insert); only staff may read/update/delete.
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

-- Wishlist: anonymous, device-scoped — no auth.uid() to scope by, so access
-- is open to anon/authenticated and every query filters by device_id at the
-- application layer (same trust level already extended to public catalogue reads).
alter table wishlist_items enable row level security;
create policy "wishlist_items_anon_all" on wishlist_items
  for all to anon, authenticated using (true) with check (true);

-- Profiles: a user can read their own row; admins manage all roles.
alter table profiles enable row level security;
create policy "profiles_self_read" on profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_admin_all" on profiles
  for all to authenticated using (is_admin()) with check (is_admin());

-- =============================================================================
-- 10. STORAGE BUCKETS
--
-- Public-read (public URLs for product/category images etc.); only staff may
-- upload/modify/delete. Bucket names match what the app code references
-- (lib/supabase storage calls in components/admin/*).
-- =============================================================================

insert into storage.buckets (id, name, public) values
  ('product-images',  'product-images',  true),
  ('category-images', 'category-images', true),
  ('play-area',        'play-area',       true),
  ('about',            'about',           true),
  ('hero',             'hero',            true),
  ('banners',          'banners',         true),
  ('testimonials',     'testimonials',    true),
  ('general',          'general',         true)
on conflict (id) do nothing;

create policy "mm_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in (
    'product-images','category-images','play-area','about','hero','banners','testimonials','general'
  ));

create policy "mm_staff_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-images','category-images','play-area','about','hero','banners','testimonials','general')
    and is_staff()
  );

create policy "mm_staff_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('product-images','category-images','play-area','about','hero','banners','testimonials','general')
    and is_staff()
  );

create policy "mm_staff_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('product-images','category-images','play-area','about','hero','banners','testimonials','general')
    and is_staff()
  );

-- =============================================================================
-- Done. Next: run supabase/seed.sql, then create your first admin user
-- (Authentication → Users → Add User) and promote them — see SUPABASE_SETUP.md.
-- =============================================================================
