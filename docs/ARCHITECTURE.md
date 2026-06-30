# Mini Magic — Solution Architecture (v2, implementation-ready)

**Stack:** Next.js (frontend) · Next.js admin (same app, `/admin` route group) · Supabase (PostgreSQL + Auth + Storage)
**Type:** Dynamic store **catalogue** website (browse / discover / enquire) — **not** a checkout/cart ecommerce platform.
**Status:** ✅ Architecture approved. This v2 folds in the final review decisions. **No Supabase built yet.**

### Revision v2 — approved decisions applied
1. **Prices:** show by default; per-product `price_display` supports **Hide Price** and **Enquire for Price** (`price` now nullable).
2. **Offers:** the real discount is per-product `sale_price`. `category_offers` → **`category_promotions`** (banner/marketing only; no price math).
3. **Featured products:** `products.featured` **removed**; homepage uses the manually-curated **`homepage_featured_products`** only.
4. **WhatsApp:** primary enquiry CTA; product & play-area pages generate **pre-filled WhatsApp messages** (`enquiries.channel` records it).
5. **Enquiries:** enhanced model — assignment, notes timeline, status workflow, attribution, conversion tracking.
6. **New tables:** `testimonials`, `redirects`, `audit_log`, `business_hours`.
7. **Age groups:** controlled, admin-managed list (`age_groups`) with **`product_age_groups`** M:N for faceted filtering.

### Revision v2.1 — final pre-implementation adjustments
8. **Availability:** `stock_status` enum **removed**; replaced by a single `products.available boolean`
   (catalogue model — no checkout stock states).
9. **Subcategories deferred:** not used by the current UI → `categories.parent_id` and
   `products.subcategory_id` **removed for launch** (re-add via a later migration if needed).
10. **Scheduling:** `starts_at` / `ends_at` added to `homepage_hero_slides` **and**
    `promotional_banners` (seasonal activation, matching `category_promotions`).

> Items raised in the review but still **not** adopted: `homepage_sections.config` jsonb,
> per-entity `og_image`/`noindex`. (All other review items are now applied.)

---

## Phase 1 — Codebase Analysis (actual current state)

### 1.1 Routes (`app/`)
| Route | File | Render | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | Hero, Categories, Popular, Promotions, Offers, New Arrivals, Features |
| `/categories` | `app/categories/page.tsx` | Client | Category cards + filterable product grid |
| `/categories/[slug]` | `app/categories/[slug]/page.tsx` | SSG | Category landing + products |
| `/products` | `app/products/page.tsx` | Static | All products |
| `/products/[slug]` | `app/products/[slug]/page.tsx` | SSG | Detail + related + enquiry |
| `/offers` | `app/offers/page.tsx` | Server | Discounted products |
| `/play-area` | `app/play-area/page.tsx` | Server | Hero, zones, packages, visit info |
| `/about` | `app/about/page.tsx` | Server | Story, mission, stats, team, gallery |
| `/contact` | `app/contact/page.tsx` | Static | Contact info + enquiry |
| `/search` | `app/search/page.tsx` | Dynamic | `?q=` across catalogue |
| `/policies` | `app/policies/page.tsx` | Static | Privacy/Terms/Cookies |
| `not-found` | `app/not-found.tsx` | Static | 404 |
| `POST /api/enquiries` | `app/api/enquiries/route.ts` | Handler | **Enquiry write seam (stubbed)** |

### 1.2 Components (`components/`)
Presentational + reusable: `Header`, `Footer`, `Hero`, `Categories`, `PopularToys`, `NewArrivals`,
`Promotions`, `OffersGrid`, `Features`, `ProductCard`, `ProductGrid`, `SearchBar`, `SearchResults`,
`EnquiryButton` (modal), `StatCounter`.

### 1.3 Current data layer (the seam already exists)
```
data/products.ts   data/categories.ts   data/playArea.ts     ← seed catalogues (in-memory)
        │                  │                    │
        └──────────────────┴────────────────────┘
                           ▼
lib/products.ts  lib/categories.ts  lib/search.ts  lib/format.ts   ← repository (read API)
                           ▼
                  components/ + app/                                  ← UI (never reads data/* directly)

config/site.ts   ← brand, nav, contact, socials, announcements
types/index.ts   ← domain contract (Product, Category, Seo, EnquiryPayload, …)
```
**Key insight:** the UI already reads through ~15 functions in `lib/*`. Supabase integration =
reimplement those function bodies + the `/api/enquiries` handler. **No component markup changes.**

### 1.4 Existing content sections that must become admin-managed
Hero slides, category rail, popular/new/featured/promo products, promotional banners, play-area
(zones, packages, features, visit info), about (story/mission/vision/stats/team/gallery), footer,
contact, announcements bar, per-page SEO, **enquiries + lead workflow**, testimonials, business hours.

---

## Phase 2 — Database Design (Supabase / PostgreSQL)

### 2.1 Conventions
- Primary keys: `uuid default gen_random_uuid()`.
- Timestamps: `created_at`, `updated_at timestamptz default now()` (auto-touch trigger).
- Money: `numeric(10,2)`. Ordering: `display_order`/`sort_order int default 0`.
- Slugs: `text` + `unique`. Soft visibility via `active`/`featured`/`published` booleans.
- Enums via Postgres `create type`.
- Singleton config tables enforce one row via a fixed PK / check.
- **Migration order:** enums → `categories` → `age_groups` → `products` → product children →
  `play_area*` → `profiles` → `enquiries`/`enquiry_notes` → remaining content/ops tables → indexes →
  triggers → RLS → storage.

### 2.2 Enumerated types
```sql
-- v2.1: stock_status REMOVED — catalogue uses products.available (boolean) instead.
create type price_display      as enum ('show','hide','enquire');            -- v2: price visibility
create type enquiry_type       as enum ('product','play_area','contact','general');
create type enquiry_status     as enum ('new','contacted','in_progress','converted','lost'); -- v2
create type enquiry_channel    as enum ('web_form','whatsapp','phone','email');             -- v2
create type contact_preference as enum ('phone','whatsapp','email','any');                  -- v2
create type audit_action       as enum ('insert','update','delete');                        -- v2
create type nav_location       as enum ('header','footer_quick','footer_category');
create type user_role          as enum ('admin','editor','viewer');
```

### 2.3 Catalogue tables

```sql
-- CATEGORIES (v2.1: subcategories deferred — no parent_id for launch)
create table categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  emoji         text,                       -- placeholder until images
  color         text,                       -- tailwind theme class
  image         text,                       -- storage URL
  banner_image  text,
  featured      boolean not null default false,   -- drives homepage category rail
  display_order int not null default 0,
  seo_title     text,
  seo_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on categories (featured) where featured;

-- AGE GROUPS (v2: controlled, admin-managed list for faceted filtering)
create table age_groups (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,              -- "3–5 years"
  slug        text not null unique,       -- "3-5"  → used in filter URLs (?age=3-5)
  min_age     int,                        -- years; for sorting / range logic
  max_age     int,                        -- null = open-ended (e.g. 12+)
  sort_order  int not null default 0
);
-- seed: 0-1, 1-3, 3-5, 5-8, 8-12, 12+, all-ages

-- PRODUCTS
create table products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  sku             text unique,
  short_description text,
  description     text,
  category_id     uuid not null references categories(id) on delete restrict,
  price           numeric(10,2),            -- v2: NULLABLE (hidden / "enquire" products)
  price_display   price_display not null default 'show',  -- v2: show | hide | enquire
  sale_price      numeric(10,2),            -- the ONLY real discount; null = not on sale
  material        text,
  color           text,
  available       boolean not null default true,         -- v2.1: catalogue availability (replaces stock_status)
  tags            text[] default '{}',
  features        text[] default '{}',      -- "Why Kids Love It" (ordered)
  popular         boolean not null default false,
  new_arrival     boolean not null default false,
  -- NOTE (v2): products.featured REMOVED — featuring is curated via homepage_featured_products.
  -- NOTE (v2): age_group text REMOVED — replaced by product_age_groups (M:N) below.
  -- NOTE (v2.1): subcategory_id REMOVED — subcategories deferred for launch.
  display_order   int not null default 0,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (sale_price is null or price is null or sale_price <= price)
);
create index on products (category_id);
create index on products (popular)     where popular;
create index on products (new_arrival) where new_arrival;
create index on products (sale_price)  where sale_price is not null;  -- offers listing

-- PRODUCT ↔ AGE GROUPS (v2: a toy can suit multiple brackets → multi-select + filterable)
create table product_age_groups (
  product_id   uuid not null references products(id) on delete cascade,
  age_group_id uuid not null references age_groups(id) on delete restrict,
  primary key (product_id, age_group_id)
);
create index on product_age_groups (age_group_id);

-- PRODUCT IMAGES (gallery, multiple per product)
create table product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  image_url   text not null,
  alt_text    text,
  is_primary  boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index on product_images (product_id);
-- exactly one primary image per product
create unique index one_primary_per_product on product_images (product_id) where is_primary;

-- RELATED PRODUCTS (curated many-to-many self relation; optional — UI falls back to same category)
create table product_related (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references products(id) on delete cascade,
  related_product_id uuid not null references products(id) on delete cascade,
  sort_order         int not null default 0,
  unique (product_id, related_product_id),
  check (product_id <> related_product_id)
);

-- CATEGORY PROMOTIONS (v2: renamed from category_offers — BANNER/MARKETING ONLY).
-- Does NOT compute any product price; real discounts live in products.sale_price.
create table category_promotions (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references categories(id) on delete cascade,
  title         text not null,
  badge_text    text,                       -- display only, e.g. "Up to 40% Off"
  description   text,
  image         text,
  link          text,                       -- CTA target (defaults to the category page)
  active        boolean not null default true,
  starts_at     timestamptz,
  ends_at       timestamptz,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);
create index on category_promotions (category_id);
```

### 2.4 Homepage tables

```sql
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
  starts_at     timestamptz,                -- v2.1: optional scheduled activation
  ends_at       timestamptz,                -- v2.1: optional scheduled expiry
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Enable/disable/reorder homepage sections. section_key: hero, categories, popular,
-- promotions, offers, new_arrivals, featured_products, testimonials, features.
create table homepage_sections (
  id            uuid primary key default gen_random_uuid(),
  section_key   text not null unique,
  title         text,
  enabled       boolean not null default true,
  display_order int not null default 0,
  config        jsonb not null default '{}'   -- per-section options (e.g. {"limit":4})
);

-- v2: the SINGLE featuring mechanism — manually curated, ordered by admin.
create table homepage_featured_products (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  sort_order  int not null default 0,
  unique (product_id)
);

-- Promotional banners (the "40% Off / Explore" blocks). Display text only.
create table promotional_banners (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  subtitle      text,
  badge_text    text,                       -- e.g. "40% Off" (display only)
  image         text,
  link          text,                       -- e.g. /categories/toys
  active        boolean not null default true,
  starts_at     timestamptz,                -- v2.1: optional scheduled activation
  ends_at       timestamptz,                -- v2.1: optional scheduled expiry
  display_order int not null default 0
);
```

### 2.5 Play Area tables

```sql
create table play_area (                    -- singleton (id fixed to 1)
  id               int primary key default 1 check (id = 1),
  hero_image       text,
  hero_title       text,
  hero_description text,
  timings          jsonb not null default '[]',  -- [{label, value}]
  pricing          jsonb not null default '[]',  -- [{label, value}]
  rules            text[] default '{}',
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
  price        text not null,              -- "From ₹4,999" (display string)
  description  text,
  features     text[] default '{}',
  active       boolean not null default true,
  sort_order   int not null default 0
);

create table play_area_features (          -- trust badges (supervised, sanitised…)
  id          uuid primary key default gen_random_uuid(),
  icon        text,
  title       text not null,
  description text,
  sort_order  int not null default 0
);
```

### 2.6 About / Team / Testimonials tables

```sql
create table about_page (                  -- singleton
  id              int primary key default 1 check (id = 1),
  story           text,
  mission         text,
  vision          text,
  values_text     text,
  gallery         jsonb not null default '[]',  -- [{image, label}]
  seo_title       text,
  seo_description text,
  updated_at      timestamptz not null default now()
);

create table about_statistics (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  value       numeric not null,
  suffix      text,                        -- '+', '★', '%'
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

-- v2: NEW — social proof for trust / lead generation
create table testimonials (
  id            uuid primary key default gen_random_uuid(),
  author_name   text not null,
  author_role   text,                       -- "Parent of two"
  quote         text not null,
  rating        int check (rating between 1 and 5),
  image         text,
  active        boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);
```

### 2.7 Global / settings / operations tables

```sql
create table contact_information (         -- singleton
  id        int primary key default 1 check (id = 1),
  phone     text,
  whatsapp  text,                          -- drives WhatsApp deep-link CTAs (v2)
  email     text,
  address   text,
  map_url   text,
  updated_at timestamptz not null default now()
);

-- v2: NEW — store opening hours (one row per weekday)
create table business_hours (
  id          uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6),  -- 0=Sunday
  opens_at    time,
  closes_at   time,
  is_closed   boolean not null default false,
  note        text,                         -- "Holidays closed"
  unique (day_of_week)
);

-- Header + footer navigation (location enum decides where it shows)
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
  platform    text not null,               -- facebook, instagram…
  url         text not null,
  icon        text,                        -- svg path or key
  sort_order  int not null default 0,
  active      boolean not null default true
);

-- Free-form global settings: footer_text, announcements[], default price_display, brand, etc.
create table site_settings (
  key   text primary key,
  value jsonb not null
);

-- SEO for STATIC pages (per-entity SEO lives on products/categories rows)
create table seo_pages (
  id              uuid primary key default gen_random_uuid(),
  page_key        text not null unique,    -- home|offers|play-area|about|contact|categories
  meta_title      text,
  meta_description text,
  keywords        text[] default '{}',
  og_image        text,
  canonical       text,
  updated_at      timestamptz not null default now()
);

-- v2: NEW — preserve URLs/SEO when a slug changes (consumed by middleware)
create table redirects (
  id           uuid primary key default gen_random_uuid(),
  from_path    text not null unique,        -- "/products/old-slug"
  to_path      text not null,               -- "/products/new-slug"
  is_permanent boolean not null default true, -- 301 vs 302
  created_at   timestamptz not null default now()
);

-- v2: NEW — who changed what (multi-staff accountability)
create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  action      audit_action not null,
  table_name  text not null,
  row_id      text,
  diff        jsonb,
  created_at  timestamptz not null default now()
);
create index on audit_log (table_name, created_at desc);
```

### 2.8 Enquiries + Auth (v2 — the lead-management core)

```sql
-- Admin roles (joins Supabase auth.users) — created before enquiries (FK target)
create table profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  email text,
  role  user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create table enquiries (
  id                uuid primary key default gen_random_uuid(),
  -- contact
  name              text not null,
  phone             text not null,
  email             text,                              -- optional (phone/WhatsApp-first)
  preferred_contact contact_preference not null default 'any',
  channel           enquiry_channel not null default 'web_form',   -- web_form | whatsapp | …
  -- what it's about
  enquiry_type      enquiry_type not null default 'general',
  product_id        uuid references products(id) on delete set null,
  package_id        uuid references play_area_packages(id) on delete set null,
  subject           text,
  message           text,
  -- play-area / scheduling specifics
  preferred_date    date,
  children_count    int,
  -- workflow & conversion tracking
  status            enquiry_status not null default 'new',
  assigned_to       uuid references profiles(id) on delete set null,
  contacted_at      timestamptz,
  converted_at      timestamptz,
  outcome_reason    text,                              -- esp. for 'lost'
  estimated_value   numeric(10,2),
  -- attribution (lead-gen analytics)
  source_page       text,
  referrer          text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  metadata          jsonb not null default '{}',       -- any future type-specific fields
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on enquiries (status, created_at desc);
create index on enquiries (assigned_to);
create index on enquiries (enquiry_type);
create index on enquiries (product_id);

-- Follow-up activity timeline per enquiry
create table enquiry_notes (
  id          uuid primary key default gen_random_uuid(),
  enquiry_id  uuid not null references enquiries(id) on delete cascade,
  note        text not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index on enquiry_notes (enquiry_id, created_at);
```

**Status workflow:** `new → contacted → in_progress → converted` (set `converted_at`) or `→ lost`
(set `outcome_reason`). `converted` is the ROI metric — did the lead become a store visit/sale.

### 2.9 Triggers, RLS & Storage

**Auto-touch `updated_at`** (attach to every table with `updated_at`):
```sql
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_products_touch before update on products
  for each row execute function touch_updated_at();
```

**Row Level Security (the security model):**
- **Public (anon) read** on catalogue/content tables: products, product_images, product_age_groups,
  age_groups, product_related, categories, category_promotions, homepage_*, promotional_banners,
  play_area*, about*, team_members, **testimonials**, contact_information, **business_hours**,
  navigation_links, social_links, site_settings, seo_pages, **redirects**.
- **Public (anon) INSERT** on `enquiries` only (visitors submit; including best-effort WhatsApp
  channel logging). **No public SELECT** on enquiries.
- **Admin-only** (authenticated + `profiles.role in ('admin','editor')`) for all
  INSERT/UPDATE/DELETE on content tables, and **all access** to `enquiries`, `enquiry_notes`,
  `audit_log`, `profiles`.

```sql
alter table products enable row level security;
create policy "public read products" on products for select to anon, authenticated using (true);
create policy "admin write products" on products for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','editor')))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','editor')));

alter table enquiries enable row level security;
create policy "public submit enquiry" on enquiries for insert to anon, authenticated with check (true);
create policy "admin manage enquiries" on enquiries for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','editor')));
-- (repeat the read/write pattern per table)
```

**Supabase Storage buckets** (public read, admin write):
`product-images`, `category-images`, `play-area`, `about`, `hero`, `banners`, `testimonials`, `general`.

---

## Phase 3 — Relationships (ER Diagram)

```mermaid
erDiagram
  categories ||--o{ products              : "category_id"
  categories ||--o{ category_promotions   : "banner"
  age_groups ||--o{ product_age_groups    : "bracket"
  products   ||--o{ product_age_groups    : "tagged"
  products   ||--o{ product_images        : "gallery"
  products   ||--o{ product_related       : "product_id"
  products   ||--o{ product_related       : "related_product_id"
  products   ||--o{ homepage_featured_products : "curated"
  products   ||--o{ enquiries             : "product_id (optional)"
  play_area_packages ||--o{ enquiries     : "package_id (optional)"
  enquiries  ||--o{ enquiry_notes         : "timeline"
  profiles   ||--o{ enquiries             : "assigned_to"
  profiles   ||--o{ enquiry_notes         : "created_by"
  profiles   ||--o{ audit_log             : "actor"
  auth_users ||--|| profiles              : "role"

  products   { uuid id PK; text slug UK; uuid category_id FK; numeric price; price_display price_display; numeric sale_price }
  age_groups { uuid id PK; text slug UK; int min_age; int max_age }
  product_age_groups { uuid product_id FK; uuid age_group_id FK }
  category_promotions { uuid id PK; uuid category_id FK; text badge_text; bool active }
  enquiries  { uuid id PK; uuid product_id FK; uuid package_id FK; uuid assigned_to FK; enquiry_status status; enquiry_channel channel }
  enquiry_notes { uuid id PK; uuid enquiry_id FK; uuid created_by FK }
```

**Relationship rationale**
- **categories → products** (1:M): each product has one `category_id` (`on delete restrict` — a
  category with products can't be deleted). Subcategories are **deferred for launch** (v2.1).
- **products ↔ age_groups** via **product_age_groups** (M:N): a toy can suit several brackets;
  enables age-faceted browsing (`/categories/toys?age=3-5`).
- **products → product_images** (1:M, cascade); one primary enforced by partial unique index.
- **products ↔ products** via **product_related** (M:N self join); optional curation, category fallback.
- **categories → category_promotions** (1:M): marketing banners only — **no price effect**.
- **homepage_featured_products → products** (M:N curated): the sole "featured" mechanism (v2).
- **enquiries → products / play_area_packages** (M:1, set null): leads survive entity deletion.
- **enquiries → profiles** (`assigned_to`) and **enquiry_notes → enquiries/profiles**: lead ownership
  + follow-up timeline.
- **profiles → audit_log** (actor); **auth.users → profiles** (1:1 role) drives RLS.
- Singletons (`play_area`, `about_page`, `contact_information`) use a fixed PK = one editable row.

---

## Phase 4 — Admin Panel Design

**Placement:** same Next.js app, route group `app/(admin)/admin/**`, guarded by Supabase Auth +
`middleware.ts` (redirect unauthenticated → `/admin/login`; check `profiles.role`). One deploy, one
type contract. All writes also append to `audit_log` and trigger storefront `revalidateTag`.

| Module | Route | Capabilities | Tables |
|---|---|---|---|
| **Dashboard** | `/admin` | Enquiries this week vs last, **conversion rate**, top products by enquiries, recent leads | aggregate reads |
| **Products** | `/admin/products` | CRUD, image gallery upload, **price + price_display (show/hide/enquire)**, sale price, **age-group multi-select**, related picker, popular/new toggles, SEO, reorder | products, product_images, product_age_groups, product_related |
| **Categories** | `/admin/categories` | CRUD, image+banner, **promotions (banners)**, SEO, reorder | categories, category_promotions |
| **Homepage** | `/admin/homepage` | Hero slides, **featured-products curation (drag-order)**, promo banners, section enable/disable/reorder | homepage_hero_slides, homepage_featured_products, promotional_banners, homepage_sections |
| **Play Area** | `/admin/play-area` | Hero, gallery, packages, features, timings/pricing/rules, SEO | play_area, play_area_gallery, play_area_packages, play_area_features |
| **About & Testimonials** | `/admin/about` | Story/mission/vision, statistics, team, **testimonials**, gallery, SEO | about_page, about_statistics, team_members, testimonials |
| **Enquiries (CRM)** | `/admin/enquiries` | Inbox; filter by type/status/assignee; **assign**, **status workflow**, **notes timeline**, **mark converted/lost (+value)**, view attribution; CSV export | enquiries, enquiry_notes |
| **Settings** | `/admin/settings` | Contact, **business hours**, nav links, social links, footer, announcements, default price display | contact_information, business_hours, navigation_links, social_links, site_settings |
| **SEO & Redirects** | `/admin/seo` | Per static-page meta/OG/keywords (auto-generated defaults); **redirects** manager | seo_pages, redirects |
| **Users & Audit** | `/admin/users` | Manage roles (admin only); **audit log** viewer | profiles, audit_log |

**Shared admin building blocks:** data table (sort/filter/paginate), zod-validated entity forms,
image uploader (Supabase Storage + drag-reorder), repeater fields for `features[]`/`tags[]`,
age-group checkbox group, confirm-delete, toast notifications, optimistic updates +
`revalidateTag`, SEO field with char-count + WhatsApp/Google preview.

---

## Phase 5 — Frontend → Database Mapping

| Frontend section (component / page) | Source table(s) | Replaces (current) |
|---|---|---|
| Header nav, announcements bar | navigation_links (header), site_settings | `config/site.ts` |
| Homepage Hero (`Hero`) | homepage_hero_slides | `lib/hero.ts` |
| Categories rail (`Categories`) | categories (featured) | `data/categories.ts` |
| Most Popular (`PopularToys`) | products (popular) | `data/products.ts` |
| New Arrivals (`NewArrivals`) | products (new_arrival) | `data/products.ts` |
| Featured Products (homepage) | homepage_featured_products (curated) | products.featured (removed) |
| Promotions (`Promotions`) | promotional_banners / category_promotions | derived in code |
| Special Offers (`OffersGrid`, `/offers`) | products (sale_price not null) | `lib/products.ts` |
| Section order/visibility | homepage_sections | hardcoded in `app/page.tsx` |
| Category page + `[slug]` + **age filter** | categories, products, age_groups, product_age_groups | `data/*` |
| Product card (`ProductCard`) | products, product_images | `data/products.ts` |
| Product price display | products.price + price_display (show/hide/enquire) | static price |
| Product detail (`/products/[slug]`) | products, product_images, product_related, product_age_groups, categories | `data/products.ts` |
| Related products | product_related (+ category fallback) | `lib/products.ts` |
| **Enquiry CTA (primary)** | **WhatsApp deep link** `wa.me/{contact.whatsapp}?text=…` + enquiries (best-effort `channel='whatsapp'`) | — |
| Enquiry form (fallback, fully tracked) | enquiries (insert) + attribution | `/api/enquiries` stub |
| Search (`/search`) | products, categories, play_area_gallery | `lib/search.ts` |
| Play Area (`/play-area`) | play_area, play_area_gallery, play_area_packages, play_area_features | `data/playArea.ts` |
| Testimonials section | testimonials | none |
| About (`/about`) | about_page, about_statistics, team_members | constants |
| Footer (`Footer`) | navigation_links (footer_*), social_links, contact_information, business_hours, site_settings | `config/site.ts` |
| Contact (`/contact`) | contact_information, business_hours | `config/site.ts` |
| Per-page `generateMetadata` | seo_pages + products.seo_* / categories.seo_* | `metadata` literals |
| URL redirects on renamed slugs | redirects (via `middleware.ts`) | none |

**WhatsApp lead flow (v2):** product & play-area pages render a primary **"Enquire on WhatsApp"**
button → `https://wa.me/<contact.whatsapp>?text=<prefilled "Hi, I'm interested in {name} — {url}">`.
Before opening, a fire-and-forget `POST /api/enquiries` records `channel='whatsapp'` + attribution
(best effort). The form remains the secondary, fully-tracked path.

---

## Phase 6 — Implementation Roadmap

> Each phase is independently shippable; the storefront keeps working because the UI depends only on
> `lib/*` repository signatures, not the data source.

**Phase 1 — Database (Supabase)**
1. Create project; enable `pgcrypto`/`gen_random_uuid`.
2. Run migration in the order in §2.1: enums → tables → indexes → triggers → RLS.
3. Seed `age_groups` (0-1 … 12+) and storage buckets + policies.
4. Seed catalogue/content from existing `data/*` so prod == current site.
5. `supabase gen types typescript` → reconcile with `types/index.ts`.

**Phase 2 — Admin Panel**
1. `app/(admin)/admin` route group, Supabase Auth, `middleware.ts` role guard, `profiles`, `audit_log` writes.
2. Dashboard + Products (incl. price_display + age-group multi-select) + Categories CRUD with images.
3. Homepage (featured curation), Play Area, About & Testimonials, Settings (business hours), SEO & Redirects.
4. **Enquiries CRM** — assign, status workflow, notes timeline, convert/lost, CSV export.

**Phase 3 — Frontend Integration**
1. Add `lib/supabase/{server,client}.ts`.
2. Reimplement `lib/products.ts` / `lib/categories.ts` / `lib/search.ts` as `async` Supabase reads
   (same return types) → `await` at call sites; add age-group filtering to category queries.
3. Replace `config/site.ts` reads with `contact_information` / `navigation_links` / `business_hours` / `site_settings`.
4. Implement WhatsApp CTA + `POST /api/enquiries` insert (channel + attribution). Add `middleware.ts`
   redirect lookup. **ISR + on-demand `revalidateTag` on every admin write.**

**Phase 4 — Authentication** — admin-only (Supabase email/password or magic link); RLS enforces access; storefront stays anon.

**Phase 5 — SEO** — wire `seo_pages` + entity SEO into `generateMetadata` (auto-generated defaults);
`app/sitemap.ts` + `app/robots.ts` from slugs; JSON-LD `Product` on detail pages + **`LocalBusiness`**
(address/hours/phone) site-wide; OG images from Storage.

**Phase 6 — Deployment** — Vercel; env (Supabase URL, anon key, service role for admin server actions);
image `remotePatterns` for the Storage domain; backups + RLS review; analytics.

---

## Key architectural decisions (v2)
1. **Catalogue, not commerce** — no cart/orders/payments; enquiries are the conversion path.
2. **WhatsApp-first lead capture** — primary CTA with pre-filled messages; form is the tracked fallback.
3. **Enquiries are a mini-CRM** — assignment, notes, status workflow, attribution, conversion tracking.
4. **Prices flexible** — show by default; per-product Hide / "Enquire for price".
5. **One discount mechanism** — per-product `sale_price`; `category_promotions` are banners only.
6. **One featuring mechanism** — curated `homepage_featured_products` (no `products.featured`).
7. **Age groups are first-class & filterable** — `age_groups` + `product_age_groups` (M:N).
8. **Repository seam already in place** — Supabase swaps in behind `lib/*` with no UI rewrite.
9. **RLS-first security** + **audit log** for multi-staff accountability.
10. **Admin in the same Next.js app** — one deploy; every write revalidates the storefront.
