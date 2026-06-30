-- =============================================================================
-- Mini Magic — Initial schema (Architecture v2.1)
-- Catalogue + lead-generation site (no checkout). See docs/ARCHITECTURE.md §2.
-- Order: extensions → enums → tables (dependency order) → indexes → triggers.
-- RLS policies and storage buckets live in later migrations.
-- =============================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- Enumerated types
-- -----------------------------------------------------------------------------
create type price_display      as enum ('show', 'hide', 'enquire');
create type enquiry_type       as enum ('product', 'play_area', 'contact', 'general');
create type enquiry_status     as enum ('new', 'contacted', 'in_progress', 'converted', 'lost');
create type enquiry_channel    as enum ('web_form', 'whatsapp', 'phone', 'email');
create type contact_preference as enum ('phone', 'whatsapp', 'email', 'any');
create type audit_action       as enum ('insert', 'update', 'delete');
create type nav_location       as enum ('header', 'footer_quick', 'footer_category');
create type user_role          as enum ('admin', 'editor', 'viewer');

-- -----------------------------------------------------------------------------
-- Catalogue
-- -----------------------------------------------------------------------------
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

create table age_groups (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  slug        text not null unique,
  min_age     int,
  max_age     int,
  sort_order  int not null default 0
);

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

create table product_age_groups (
  product_id   uuid not null references products(id) on delete cascade,
  age_group_id uuid not null references age_groups(id) on delete restrict,
  primary key (product_id, age_group_id)
);
create index product_age_groups_age_idx on product_age_groups (age_group_id);

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

create table product_related (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references products(id) on delete cascade,
  related_product_id uuid not null references products(id) on delete cascade,
  sort_order         int not null default 0,
  unique (product_id, related_product_id),
  constraint product_related_no_self check (product_id <> related_product_id)
);

-- Banner / marketing only — does NOT compute product prices.
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

-- -----------------------------------------------------------------------------
-- Homepage
-- -----------------------------------------------------------------------------
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

create table homepage_sections (
  id            uuid primary key default gen_random_uuid(),
  section_key   text not null unique,
  title         text,
  enabled       boolean not null default true,
  display_order int not null default 0,
  config        jsonb not null default '{}'
);

create table homepage_featured_products (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  sort_order  int not null default 0,
  unique (product_id)
);

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

-- -----------------------------------------------------------------------------
-- Play Area
-- -----------------------------------------------------------------------------
create table play_area (
  id               int primary key default 1 check (id = 1),
  hero_image       text,
  hero_title       text,
  hero_description text,
  timings          jsonb not null default '[]',
  pricing          jsonb not null default '[]',
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

create table play_area_packages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  price        text not null,
  description  text,
  features     text[] not null default '{}',
  active       boolean not null default true,
  sort_order   int not null default 0
);

create table play_area_features (
  id          uuid primary key default gen_random_uuid(),
  icon        text,
  title       text not null,
  description text,
  sort_order  int not null default 0
);

-- -----------------------------------------------------------------------------
-- About / Team / Testimonials
-- -----------------------------------------------------------------------------
create table about_page (
  id              int primary key default 1 check (id = 1),
  story           text,
  mission         text,
  vision          text,
  values_text     text,
  gallery         jsonb not null default '[]',
  seo_title       text,
  seo_description text,
  updated_at      timestamptz not null default now()
);

create table about_statistics (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  value       numeric not null,
  suffix      text,
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

-- -----------------------------------------------------------------------------
-- Global / settings / operations
-- -----------------------------------------------------------------------------
create table contact_information (
  id         int primary key default 1 check (id = 1),
  phone      text,
  whatsapp   text,
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
  location      nav_location not null,
  display_order int not null default 0,
  active        boolean not null default true
);

create table social_links (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null,
  url         text not null,
  icon        text,
  sort_order  int not null default 0,
  active      boolean not null default true
);

create table site_settings (
  key   text primary key,
  value jsonb not null
);

create table seo_pages (
  id               uuid primary key default gen_random_uuid(),
  page_key         text not null unique,
  meta_title       text,
  meta_description text,
  keywords         text[] not null default '{}',
  og_image         text,
  canonical        text,
  updated_at       timestamptz not null default now()
);

create table redirects (
  id           uuid primary key default gen_random_uuid(),
  from_path    text not null unique,
  to_path      text not null,
  is_permanent boolean not null default true,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Auth profiles + Enquiries (lead-management core)
-- -----------------------------------------------------------------------------
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create table enquiries (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  phone             text not null,
  email             text,
  preferred_contact contact_preference not null default 'any',
  channel           enquiry_channel not null default 'web_form',
  enquiry_type      enquiry_type not null default 'general',
  product_id        uuid references products(id) on delete set null,
  package_id        uuid references play_area_packages(id) on delete set null,
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

create table enquiry_notes (
  id         uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries(id) on delete cascade,
  note       text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index enquiry_notes_enquiry_idx on enquiry_notes (enquiry_id, created_at);

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

-- -----------------------------------------------------------------------------
-- updated_at auto-touch trigger
-- -----------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger t_categories_touch    before update on categories           for each row execute function touch_updated_at();
create trigger t_products_touch       before update on products             for each row execute function touch_updated_at();
create trigger t_hero_touch           before update on homepage_hero_slides for each row execute function touch_updated_at();
create trigger t_play_area_touch      before update on play_area            for each row execute function touch_updated_at();
create trigger t_about_touch          before update on about_page           for each row execute function touch_updated_at();
create trigger t_contact_touch        before update on contact_information  for each row execute function touch_updated_at();
create trigger t_seo_pages_touch      before update on seo_pages            for each row execute function touch_updated_at();
create trigger t_enquiries_touch      before update on enquiries            for each row execute function touch_updated_at();
