# Mini Magic — Full Project Analysis

**Prepared:** 2026-07-11 · **Scope:** entire repository, read-only analysis · **Method:** direct
reading of every route/component/lib/schema file plus cross-referencing against the seven prior
docs already in `docs/` (which describe *plans*, not always the *current* state — discrepancies
are flagged explicitly throughout).

> **What this app actually is:** a Next.js 14 + Supabase **toy-store catalogue and CMS**, not an
> e-commerce checkout platform. There is no cart, no order, no payment, no coupon, and no product
> review system anywhere in the code or database — the conversion mechanism is a WhatsApp deep
> link and a tracked enquiry form that feed a small admin CRM. `README.md` is stale — it lists
> "Shopping Cart" and "Payment Integration" under Next Steps, but the project deliberately never
> went that direction (confirmed by `docs/ARCHITECTURE.md`'s explicit "Catalogue, not commerce"
> decision).

---

## 1. Project Overview

| | |
|---|---|
| **Name** | Mini Magic ("Minimagic") — a toy/gift store |
| **Type** | Server-rendered marketing/catalogue website + admin CMS (single Next.js app) |
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS 3 |
| **Backend** | Supabase (PostgreSQL 15, Auth, Storage) — no separate API server |
| **Auth** | Supabase email/password, admin-only (no customer accounts) |
| **Deployment** | Docker (multi-stage, `output: 'standalone'`), also deployable to Vercel |
| **State management** | None (no Redux/Zustand/Context store) — server components + `useState` locally in client islands |
| **Testing** | None found — no test runner, no `__tests__`, no Playwright/Jest config |
| **Package manager** | npm (`package-lock.json` present) |

**Core proposition:** browse toys/bags/stationery/etc. by category, view product detail, and
convert via a pre-filled **WhatsApp** message or a tracked **enquiry form** — both land in an
admin-side mini-CRM (`enquiries` + `enquiry_notes`) with status workflow, assignment, and
conversion tracking. Everything content-wise (hero slides, categories, products, homepage
sections, play-area info, about/team, contact/settings) is editable through `/admin` without a
deploy.

**Architectural lineage (from the docs already in the repo, all consistent with the code):**
1. **Phase 0** — static/hardcoded 5-page site (multiple duplicated data files, dead links).
2. **Phase 1 (Frontend audit)** — introduced `config/`, `types/`, `data/`, `lib/` layering; fixed
   every dead link; added `/products/[slug]`, `/categories/[slug]`, `/search`, `/contact`,
   `/policies`, `/api/enquiries` stub. (`docs/AUDIT.md`, `docs/FRONTEND_COMPLETION_REPORT.md`)
2. **Phase 2 (Architecture design)** — designed the full Supabase schema + admin panel + RLS model
   (`docs/ARCHITECTURE.md` — now partially stale, see §7).
3. **Phase 3 (Supabase integration)** — `lib/*.ts` functions were reimplemented to call
   `lib/supabase/repositories/*` instead of the old `data/*.ts` in-memory arrays. This is **done**;
   `data/*.ts` is now dead application code (see §9, §14).
4. **QA/stabilization pass** — found and fixed real production bugs by live execution against the
   Supabase project (broken enquiry persistence, broken image rendering, missing ISR) —
   `docs/QA_STABILIZATION_REPORT.md`. This is the most reliable of the prior docs because every
   claim in it was execution-verified, not just code-inspected.

---

## 2. Folder Structure

```
mini-magic/
├── app/                          Next.js App Router — routes
│   ├── layout.tsx                 Root layout (metadata only, no Header/Footer)
│   ├── page.tsx                    Home "/"
│   ├── not-found.tsx               404
│   ├── globals.css                 Tailwind + custom marquee/star-border keyframes
│   ├── about/page.tsx
│   ├── categories/page.tsx  +  categories/[slug]/page.tsx
│   ├── contact/page.tsx
│   ├── offers/page.tsx
│   ├── play-area/page.tsx
│   ├── policies/page.tsx
│   ├── products/page.tsx  +  products/[slug]/page.tsx
│   ├── search/page.tsx
│   ├── api/enquiries/route.ts     the ONLY API route (POST)
│   └── admin/                     Admin CMS (see §3, §6)
│       ├── login/page.tsx          public
│       └── (protected)/            route group behind middleware + requireStaff()
│           ├── layout.tsx, page.tsx (dashboard), actions.ts (signOut)
│           ├── about/ (+team/, +testimonials/)
│           ├── categories/
│           ├── enquiries/
│           ├── homepage/ (+banners/, +hero/)
│           ├── play-area/ (+features/)
│           ├── products/
│           └── settings/
├── components/                    Public storefront UI (presentational)
│   └── admin/                     Admin-only UI (forms, image tools, sidebar)
├── lib/                           Data-access "repository facade" layer
│   ├── {products,categories,about,hero,homepage,playArea,search,settings,format}.ts
│   ├── admin/{cropImage,form}.ts   Admin-only utilities
│   └── supabase/
│       ├── {client,server,browser,auth}.ts   Supabase client/session/role setup
│       ├── database.types.ts        Generated (hand-authored, meant to be regenerated) types
│       └── repositories/{about,categories,enquiries,homepage,playArea,products,settings,_util,index}.ts
├── data/                          ⚠️ DEAD APPLICATION CODE — see §9/§14 (legacy pre-Supabase
│                                    fixtures; only import site left is scripts/seed.ts)
├── types/index.ts                 Domain contract (Product, Category, EnquiryPayload, Seo, …)
├── types/assets.d.ts               Ambient CSS module declarations (TS 6.0.3 workaround)
├── config/site.ts                 Build-time brand identity + legacy nav/contact fallback
├── supabase/
│   ├── schema.sql                  Canonical current schema — run once on a fresh project
│   ├── seed.sql                    Idempotent demo-data seed
│   └── migrations/                 7 chronological migration files (see §7)
├── scripts/seed.ts                 Alternate TS seed script, sources from data/* + lib/hero.ts
├── docs/                           7 prior reports (architecture, audits, QA) — historical, some stale
├── middleware.ts                   Guards /admin/*, refreshes Supabase session cookie
├── next.config.js, tailwind.config.js, tsconfig.json, .eslintrc.json
├── Dockerfile, .dockerignore, ecr-push.sh
├── SUPABASE_SETUP.md               Step-by-step Supabase provisioning guide
└── README.md                       ⚠️ Stale — describes the pre-Phase-1 state
```

---

## 3. Complete Route Map

### Public (storefront)

| Route | File | Render mode | Data source |
|---|---|---|---|
| `/` | `app/page.tsx` | Server, **ISR 60s** | `lib/homepage`, plus self-fetching rail components |
| `/about` | `app/about/page.tsx` | Server, no revalidate (static-cached) | `lib/about` |
| `/categories` | `app/categories/page.tsx` | Server, **ISR 60s** | `lib/categories`, `lib/products` |
| `/categories/[slug]` | `app/categories/[slug]/page.tsx` | Server, **ISR 60s** (no `generateStaticParams` — needs Supabase at request time) | `lib/categories`, `lib/products`, `repositories.categories.getCategoryPromotions` (direct) |
| `/contact` | `app/contact/page.tsx` | Server, static | `lib/settings` |
| `/offers` | `app/offers/page.tsx` | Server, **ISR 60s** | `lib/products` |
| `/play-area` | `app/play-area/page.tsx` | Server, no revalidate | `lib/playArea` |
| `/policies` | `app/policies/page.tsx` | Server, static | hardcoded content + `lib/settings` (email only) |
| `/products` | `app/products/page.tsx` | Server, **ISR 60s** | `lib/products` |
| `/products/[slug]` | `app/products/[slug]/page.tsx` | Server, **ISR 60s** | `lib/products`, `lib/categories` |
| `/search` | `app/search/page.tsx` | Server, dynamic (reads `searchParams.q` directly, no Suspense needed) | `lib/search` |
| `not-found` | `app/not-found.tsx` | Static | — |
| `POST /api/enquiries` | `app/api/enquiries/route.ts` | Route handler | `repositories.enquiries.createEnquiry` |

**Inconsistency flagged:** ISR (`revalidate = 60`) is applied to Home/Categories/Category-detail/
Products/Product-detail/Offers, but **not** to About, Contact, Play Area, or Policies — even
though About/Contact/Play-Area are equally Supabase-driven. Admin saves still force-refresh these
pages via `revalidatePath`, so content isn't *stuck* stale, but there's no time-based fallback if
content changes outside the admin UI (direct SQL, scripts).

### Admin (CMS, all under `/admin`, guarded by `middleware.ts` + `requireStaff()`)

| Route | Purpose |
|---|---|
| `/admin/login` | Public login (client component, direct `supabase.auth.signInWithPassword`) |
| `/admin` | Dashboard — product/category/enquiry counts, recent enquiries |
| `/admin/products`, `/products/[id]`, `/products/new` | Product CRUD, images, age groups, related products |
| `/admin/categories`, `/categories/[id]`, `/categories/new` | Category CRUD, images, promotions (banners) |
| `/admin/homepage`, `/homepage/hero/[id]`, `/homepage/hero/new`, `/homepage/banners/[id]`, `/homepage/banners/new` | Hero slides, featured-product curation, promotional banners |
| `/admin/play-area`, `/play-area/features/[id]`, `/play-area/features/new` | Hero/rules/SEO, gallery, trust-badge features |
| `/admin/about`, `/about/team/[id]`, `/about/team/new`, `/about/testimonials/[id]` ⚠️, `/about/testimonials/new` ⚠️ | Story/mission/vision, statistics, team, gallery. **Testimonial routes are orphaned** — no nav link reaches them, see §14 |
| `/admin/enquiries`, `/enquiries/[id]` | Lead CRM — filter, status workflow, assignment, notes, convert/lost |
| `/admin/settings` | Footer tagline + contact information |

**Total routes:** 13 public page routes + 1 API route + ~30 admin routes (including dynamic
`[id]`/`new` variants across 6 modules).

---

## 4. Feature Documentation

| Feature | Present? | Notes |
|---|---|---|
| Product catalogue (browse/detail/related) | ✅ | Full CRUD in admin; images, sale price, age groups, tags, features |
| Category browsing + filtering | ✅ | Client-side chip filter (`CategoryFilter.tsx`) over server-pre-rendered grids |
| Age-group faceted filtering | ⚠️ Partial | Schema + repository support it (`getProductsByAgeGroup`), but **no UI surface uses it** — not wired into any page's filter chips |
| Search | ✅ | Simple case-insensitive substring match across products/categories/play-area gallery; no fuzzy/ranked search |
| Offers / discounts | ✅ | Single mechanism: `products.sale_price`. `category_promotions`/`promotional_banners` are display-only, no price math |
| Homepage curation | ✅ | Hero slides, featured products (curated pivot table), promotional banners — all admin-editable. Section enable/reorder was removed (`homepage_sections` table dropped) |
| Play Area info page | ✅ | Hero, zones/gallery, trust-badge features, house rules. Packages (pricing tiers) and "Plan Your Visit" timings were removed as a product decision |
| About page (story/team/stats/gallery) | ✅ | Fully admin-editable including its own hero (added later via migration) |
| **Testimonials** | ⚠️ Half-removed | DB table, RLS, seed data, and admin CRUD/actions all still exist and work — but no admin nav link and no storefront section render them. Orphaned, not deleted |
| WhatsApp enquiry (primary CTA) | ✅ | Deep link `wa.me/<number>?text=...`, product/play-area/contact pre-filled messages; also on every `ProductCard` via `WhatsAppCardButton` |
| Enquiry form (tracked fallback) | ✅ | Modal (`EnquiryButton`) → `POST /api/enquiries` → `enquiries` table, with `source_page` (Referer) attribution |
| Enquiry CRM (admin) | ✅ | Status workflow (new→contacted→in_progress→converted/lost), assignment to staff, notes timeline, estimated value on conversion |
| Contact info + business hours | ✅ (schema) / ⚠️ (UI) | `business_hours` table exists, seeded, but **no page renders it** and no admin UI edits it (Settings only edits footer text + contact_information) |
| Navigation / footer / social links | ✅ (schema) / ⚠️ (partial wiring) | `navigation_links`/`social_links` tables exist and are read by `lib/settings.ts`, but `Header.tsx`/`Footer.tsx`/`EnquiryButton.tsx`/`WhatsAppCardButton.tsx` still read the static `config/site.ts` in places — a genuinely incomplete migration (see §11, §14) |
| SEO | ✅ Partial | Per-entity `seo_title`/`seo_description` on products/categories; `seo_pages` table for static pages exists in schema but no admin UI to edit it found; no `sitemap.ts`/`robots.ts` found in `app/` |
| Redirects (slug-change 301/302) | ⚠️ Schema only | `redirects` table exists, RLS'd, but `middleware.ts` never queries it — feature is DB-only, not implemented in code |
| Audit log | ⚠️ Schema only | `audit_log` table + RLS exist; no code anywhere writes to it (no admin action inserts an audit row) despite `docs/ARCHITECTURE.md` describing it as a core accountability feature |
| Role-based admin access | ⚠️ Partial | 3 roles exist (`admin`/`editor`/`viewer`); RLS only distinguishes staff (admin+editor) vs not; `viewer` has no defined capability and gets **silently empty** results rather than an access-denied message; enquiries actions do not even check `error` results, worsening the silent-failure UX for viewers |
| Cart / checkout / payments / coupons / reviews / wishlist / orders | ❌ Not present | Deliberately out of scope — this is a catalogue+CRM, not commerce |

---

## 5. User Workflow (storefront visitor)

1. **Land** on `/` → sees marquee announcement bar, hero carousel (`Hero.tsx`, auto-plays every
   5s, pauses on hover), featured categories rail, popular products, promotions banners, an inline
   4-item offers teaser, new arrivals, curated featured products, footer.
2. **Browse** via Header nav (Home/Categories/Offers/Play Area/About) or the category rail →
   `/categories` (client-filterable grid, all products pre-rendered server-side per category) or
   directly `/categories/[slug]` (category landing + its own promo banner if scheduled).
3. **Search** any time via the header search box (desktop) or hamburger menu (mobile) →
   `/search?q=` → results spanning products, categories, and play-area content.
4. **View a product** → `/products/[slug]`: image (or emoji placeholder), price (strikethrough +
   sale badge if discounted), stock-status label, spec list (category/material/age/color),
   description, "Why Kids Love It" features, related products rail (curated, falls back to same
   category so it's never empty).
5. **Convert:**
   - **Fast path:** tap the WhatsApp button on any `ProductCard` or the product detail page →
     opens WhatsApp with a pre-filled message naming the product; no form, no tracking write
     guaranteed (best-effort).
   - **Tracked path:** click "Send Enquiry" → modal collects name/email/phone/message → POSTs to
     `/api/enquiries` → row lands in `enquiries` with `product_id` resolved from the slug,
     `enquiry_type='product'`, `channel`, and `source_page` (Referer) attribution → success state
     in the modal, or inline error text on failure.
6. **Play Area / About / Contact / Policies** are informational pages with the same enquiry CTA
   pattern (`source="play-area"` / `"contact"`).
7. **404 handling:** unknown product/category slugs render Next's `notFound()` → the branded
   `not-found.tsx` page with links back to Home/Products.

No login, no account, no cart, no checkout exists in this flow — "checkout completion" as named in
the original prompt does not apply to this application; the terminal user action is submitting an
enquiry or opening WhatsApp.

---

## 6. Admin Workflow

1. **Sign in** at `/admin/login` (email/password via Supabase Auth, client-side
   `signInWithPassword`). `middleware.ts` redirects any unauthenticated `/admin/*` request here
   first; a signed-in user hitting `/admin/login` is bounced back to `/admin`.
2. **Land on Dashboard** (`/admin`) → 4 stat tiles (products, categories, total enquiries, new
   enquiries) each linking into the relevant module, plus the 6 most recent enquiries.
3. **Manage content** — every module (Products, Categories, Homepage, Play Area, About, Settings)
   follows the same shape: a list/settings page → `new`/`[id]` edit pages → Server Actions (all
   gated `requireStaff('editor')`, i.e. `admin` or `editor` role) → `revalidatePath()` on the
   matching storefront route(s) so changes appear without a redeploy (subject to the ISR caveat in
   §3).
   - **Products:** basics, pricing (+ sale price + price_display show/hide/enquire), attributes,
     multi-select age groups, popular/new-arrival flags, related-products picker, image gallery
     (crop → upload to `product-images` bucket → set primary), SEO fields.
   - **Categories:** basics, image + banner (separate cropped uploads to `category-images`),
     inline promotion banners (scheduled, display-only), SEO.
   - **Homepage:** hero slides, featured-product curation (ordered pivot picks), promotional
     banners with optional start/end scheduling.
   - **Play Area:** hero/rules/SEO singleton form, gallery, trust-badge features (note: an `icon`
     field is stale here — see §14).
   - **About:** story/mission/vision/SEO singleton form, statistics, team members, gallery
     (index-based JSONB array, no ids). Testimonials CRUD exists but has no entry point (§14).
   - **Settings:** footer tagline + contact info (phone/whatsapp/email/address/map URL) only —
     business hours, navigation links, and social links have DB tables and repository functions
     but **no admin UI to edit them**.
4. **Manage leads** (`/admin/enquiries`) — filter by status (`new/contacted/in_progress/
   converted/lost`) or type; open a lead to change status (auto-stamps `contacted_at`/
   `converted_at`), assign to a staff member, add timestamped notes, or mark
   converted (+ estimated value) / lost (+ reason). **Note:** these actions use the weakest role
   gate (`requireStaff()` = viewer-and-up) and never check the Supabase response for errors — see
   §14 for the resulting bug.
5. **Sign out** via the sidebar → `signOut()` server action → redirect to `/admin/login`.

Every list page computes derived data (category product counts, category name lookups) via
in-memory `Map` joins over full-table fetches rather than SQL aggregates — fine at current data
volume (single-digit-to-low-hundreds rows) but worth watching as the catalogue grows (see §12).

---

## 7. Database Documentation

**Source of truth:** `supabase/schema.sql` (568 lines) — NOT `docs/ARCHITECTURE.md`, which is
stale (see discrepancies below). Schema currently has **28 tables**, 8 enum types, and is fully
mirrored in `lib/supabase/database.types.ts`.

### 7.1 Enums
`price_display` (show/hide/enquire) · `enquiry_type` (product/play_area/contact/general) ·
`enquiry_status` (new/contacted/in_progress/converted/lost) · `enquiry_channel`
(web_form/whatsapp/phone/email) · `contact_preference` (phone/whatsapp/email/any) ·
`audit_action` (insert/update/delete) · `nav_location` (header/footer_quick/footer_category) ·
`user_role` (admin/editor/viewer)

### 7.2 Tables by domain

**Catalogue:** `categories`, `age_groups`, `products`, `product_age_groups` (M:N pivot),
`product_images` (1 primary enforced via partial unique index), `product_related` (self M:N,
curated), `category_promotions` (banner-only, no price effect).

**Homepage:** `homepage_hero_slides`, `homepage_featured_products` (curated pivot, sole
"featuring" mechanism — `products.featured` column does not exist), `promotional_banners`.

**Play Area:** `play_area` (singleton, `id=1`), `play_area_gallery`, `play_area_features`.

**About:** `about_page` (singleton), `about_statistics`, `team_members`, `testimonials` (orphaned
— see §14).

**Global/ops:** `contact_information` (singleton), `business_hours`, `navigation_links`,
`social_links`, `site_settings` (free-form KV/jsonb), `seo_pages`, `redirects`, `audit_log`.

**Auth/CRM:** `profiles` (1:1 with `auth.users`, drives RLS role), `enquiries`, `enquiry_notes`.

### 7.3 Key relationships
- `categories 1—N products` (`ON DELETE RESTRICT` — can't delete a category with products).
- `products N—N age_groups` via `product_age_groups`.
- `products 1—N product_images`, one `is_primary` enforced by a partial unique index.
- `products N—N products` via `product_related` (self-referencing, curated "related" picks).
- `products N—N homepage_featured_products` (curation pivot, unique per product).
- `enquiries → products` (`SET NULL`), `enquiries → profiles.assigned_to` (`SET NULL`) — leads
  outlive the entities they reference.
- `enquiry_notes → enquiries` (`CASCADE`), `→ profiles.created_by` (`SET NULL`).
- `auth.users 1—1 profiles` via a trigger (`handle_new_user`) that auto-creates a `viewer` profile
  on signup.

### 7.4 Triggers/functions
`touch_updated_at()` on 8 tables with an `updated_at` column · `handle_new_user()` (security
definer, auto-provisions `profiles` row on signup) · `is_staff()` / `is_admin()` (security-definer
helpers used throughout RLS so policies can query `profiles` without recursive-RLS issues).

### 7.5 Row Level Security — the actual security model
- **Pattern A (23 tables — most content tables):** `select` open to `anon`+`authenticated`;
  `insert/update/delete` gated on `is_staff()` (role `admin` or `editor`). `viewer` is excluded.
- **Pattern B (`enquiries`):** anonymous **insert** allowed (public lead capture) but **no public
  select** — leads are private; staff (`is_staff()`) get full access.
- **Pattern C (`enquiry_notes`, `audit_log`):** staff-only, no public access at all.
- **Pattern D (`profiles`):** a user can `select` only their own row; only `admin` (`is_admin()`)
  can read/manage all profiles.

### 7.6 Storage
8 public-read buckets: `product-images`, `category-images`, `play-area`, `about`, `hero`,
`banners`, `testimonials` (orphaned, §14), `general`. All public-read; insert/update/delete
require `is_staff()`.

### 7.7 Schema evolution — where it diverges from `docs/ARCHITECTURE.md`
The architecture doc describes a 30-table plan; the current schema has **28**:
- **Dropped:** `homepage_sections` (migration `20260623100000`) — the section
  enable/reorder feature was removed as a product decision; homepage render order is now fixed.
- **Dropped:** `play_area_packages` (migration `20260622130000`), along with
  `enquiries.package_id` — pricing-tier packages were removed as a product decision.
- **Added (not in original plan):** `about_page.hero_title`, `hero_description`, `hero_image`
  (migration `20260622140000` — the About page hero, originally hardcoded in `lib/hero.ts`, became
  admin-editable).
- **Unexplained drift:** `about_page.story_title` and `about_page.story_image` exist in both
  `schema.sql` and `database.types.ts` but appear in **no migration file** — likely an ad-hoc
  manual schema change that was never captured as a tracked migration. This means replaying the 7
  migration files in order on a fresh database would **not** produce byte-identical results to
  running `schema.sql` directly. Recommend adding the missing migration or removing the columns
  from `schema.sql` to make the two sources agree.

**Conclusion: treat `supabase/schema.sql` as the only authoritative schema reference.**
`docs/ARCHITECTURE.md` should be read as historical design rationale only.

---

## 8. API & Server Actions

### Public API surface
Exactly one route: **`POST /api/enquiries`** (`app/api/enquiries/route.ts`).
- Validates: `name`/`phone` non-empty strings; `email` merely `.includes('@')` (weak); `subject`/
  `source` must be strings.
- Resolves `productSlug` → `product_id` via a direct Supabase query before insert.
- Maps client `source: 'play-area'` (hyphenated) → DB enum `enquiry_type: 'play_area'`
  (underscored) via a `SOURCE_TO_ENQUIRY_TYPE` lookup (unknown sources default to `'general'`).
- Captures `Referer` header as `source_page` attribution.
- Responses: 400 malformed JSON · 422 failed validation · 500 DB insert failure (logged via
  `console.error`) · 201 success.

### Server Actions (all colocated as `actions.ts` per admin module, all Next.js Server Actions)
Every module's actions follow the same shape: `requireStaff('editor')` guard → Supabase
service/server client mutation → `revalidatePath()` on affected storefront + admin routes →
(create actions) `redirect()` to the list/edit page.

| Module | Key actions | Table(s) touched |
|---|---|---|
| Products | `createProduct` (no redirect — returns id for image upload chaining), `updateProduct`, `deleteProduct`, `addProductImage`/`deleteProductImage`/`setPrimaryImage`, `syncAgeGroups` (delete+reinsert pivot), `addRelatedProduct` (dedupe-tolerant, catches unique-violation `23505`) | `products`, `product_images`, `product_age_groups`, `product_related` |
| Categories | `createCategory`/`updateCategory`/`deleteCategory` (catches FK-restrict violation with a friendly message), `updateCategoryImage`, `createPromotion`/`deletePromotion`/`togglePromotion` | `categories`, `category_promotions` |
| Homepage | `createHeroSlide`/`updateHeroSlide`/`deleteHeroSlide`, `addFeaturedProduct`/`removeFeaturedProduct`, `createBanner`/`updateBanner`/`deleteBanner`/`toggleBanner` | `homepage_hero_slides`, `homepage_featured_products`, `promotional_banners` |
| Play Area | settings upsert, gallery add/delete, feature CRUD | `play_area`, `play_area_gallery`, `play_area_features` |
| About | settings upsert, statistics add/delete, team CRUD, gallery add/remove (index-based), **testimonial CRUD (orphaned)** | `about_page`, `about_statistics`, `team_members`, `testimonials` |
| Enquiries | `setStatus`, `assignEnquiry`, `addNote`, `markConverted`, `markLost` — **uses default `requireStaff()` (viewer+) not `('editor')`, and none check `{ error }` from Supabase** (see §14) | `enquiries`, `enquiry_notes` |
| Settings | `updateFooterText`, `updateContactInfo` | `site_settings`, `contact_information` |
| Root admin | `signOut()` | (auth only) |

No REST/GraphQL API beyond the one route handler — all admin mutation goes through Server Actions
called directly from client components (`ActionForm.tsx` wrapper), not via `<form action={...}>`
native submission, specifically so the wrapper can await the promise and drive a pending-state UI.

---

## 9. Component Overview

**Public (`components/`, 20 files)** — presentational, mostly Server Components:
`Header`/`Footer`/`Hero`/`MobileNav` (site chrome — `Hero` and `MobileNav` are client for
carousel/menu state, `Header`/`Footer` stay server and delegate interactivity down);
`Categories`/`PopularToys`/`NewArrivals`/`FeaturedProducts`/`OffersGrid`/`Promotions` (self-fetching
homepage rails); `ProductCard`/`ProductGrid` (the one shared card/grid used everywhere products are
listed); `CategoryFilter` (client chip filter over pre-rendered grids); `SearchBar`/`SearchResults`
(search UI, deliberately avoids `useSearchParams()` in the header to dodge a global Suspense
requirement); `EnquiryButton` (modal form + WhatsApp link); `WhatsAppCardButton` (per-card
WhatsApp quick-action, duplicates logic from `EnquiryButton` — see §14); `SafeImage` (workaround
for a real `next/image` SVG-sniffing bug); `StarBorder`/`StatCounter` (decorative/animated,
About-page only).

**Admin (`components/admin/`, 16 files)** — `ActionForm`/`SubmitButton`/`Spinner` (the
call-action-and-await-it pattern with pending state + toast, used everywhere); `Sidebar` (nav,
not role-filtered — see §14); `ImageUploadField`/`ImageCropModal`/`ImageManager`/
`CategoryImageField` (three overlapping but not-identical upload/crop flows — consolidation
opportunity, not a bug); one form component per entity (`ProductForm`, `CategoryForm`,
`HeroSlideForm`, `BannerForm`, `FeatureForm`, `TeamMemberForm`, `TestimonialForm` — the last one
orphaned); `DeleteCategoryButton`/`DeleteProductButton` (near-duplicate confirm-delete wrappers).

**Design pattern used throughout:** data-fetching rail/list components are `async` Server
Components with zero client JS; only components needing real interactivity (forms, carousels,
menus, filters, image crop) are `'use client'`. This keeps the public site's JS payload small.

---

## 10. Authentication Flow

**Storefront:** no authentication at all — fully anonymous/public (`anon` Supabase role for every
read, plus the one public `enquiries` insert policy).

**Admin:**
1. `middleware.ts` runs on every `/admin/*` request. If `NEXT_PUBLIC_SUPABASE_URL`/
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing it fails closed with a `503` diagnostic (not a
   crash). Otherwise it refreshes the Supabase session cookie via `@supabase/ssr`'s
   `createServerClient`, checks `supabase.auth.getUser()`:
   - No user + not `/admin/login` → redirect to `/admin/login?redirect=<path>`.
   - User + on `/admin/login` → redirect to `/admin`.
   - **Does not check role** — only that *a* session exists. Role enforcement happens deeper.
2. **Login page** (`app/admin/login/page.tsx`, client component) calls
   `createBrowserSupabase().auth.signInWithPassword()` directly — no server action for login
   itself. Displays `?error=not-staff` (set by step 3 below) as a friendly inline message.
3. **`requireStaff(minRole = 'viewer')`** (`lib/supabase/auth.ts`) is called at the top of the
   protected layout (`app/admin/(protected)/layout.tsx`) and again, redundantly (defense in depth),
   in most individual Server Actions:
   - Fetches the session user + joined `profiles` row.
   - No session → redirect `/admin/login`.
   - No profile / role not in `STAFF_ROLES` → redirect `/admin/login?error=not-staff`.
   - Role rank below `minRole` (`viewer=1 < editor=2 < admin=3`) → redirect
     `/admin?error=insufficient-role`.
   - Returns the `Profile` so callers can branch further.
4. **Database-level enforcement (the real gate):** every content table's RLS write policy checks
   `is_staff()` (`admin`/`editor` only) — so even if application-level checks were bypassed, the
   database itself refuses writes from a `viewer` or anonymous session.
5. **Sign-up flow:** there is no admin-facing sign-up UI — new staff users are created directly in
   the Supabase dashboard (per `SUPABASE_SETUP.md`), and `handle_new_user()` auto-provisions a
   `profiles` row with role `viewer`; an existing admin must manually promote them via SQL (no
   admin UI screen manages `profiles`/roles despite `docs/ARCHITECTURE.md` planning a "Users &
   Audit" module — this was never built, see §15).

**Known gap (documented in prior QA report, still true):** `viewer` is a real enum value with no
defined UI capability — a `viewer` can sign in, reach `/admin`, and see the dashboard shell, but
every staff-gated view (enquiries, most writes) is silently empty rather than showing "access
denied." Compounded in the Enquiries module specifically, where the Server Actions don't even
check Supabase's error response (see §14) — a `viewer` gets a false "success" toast on a write RLS
silently dropped.

---

## 11. Data Flow

```
Supabase Postgres (28 tables, RLS-enforced)
        │
        ▼
lib/supabase/repositories/*.ts   ← thin typed query builders, one file per domain,
                                     shared `ok()` error-unwrap + `isLive()` schedule helper
        │
        ▼
lib/{products,categories,about,homepage,playArea,search,settings}.ts
   ← reshapes DB rows into legacy UI-facing types (types/index.ts),
     several wrapped in React `cache()` for per-request de-duplication
     (NOTE: lib/playArea.ts does NOT use cache() — re-fetches the
      play_area singleton row once per helper call within one page render)
        │
        ▼
components/ + app/**/page.tsx    ← Server Components call these directly (await),
                                     Client Components (forms, search, filters) only
                                     ever talk to Server Actions / the one API route,
                                     never to Supabase directly except:
                                     - admin login (signInWithPassword)
                                     - image upload widgets (direct Storage upload
                                       from the browser client, then a server action
                                       persists the resulting URL)
```

**Two known incomplete migrations inside this pipeline:**
1. **`config/site.ts` vs Supabase settings** — `lib/settings.ts` reads `contact_information`,
   `navigation_links`, `social_links`, `site_settings` from Supabase, but `Header.tsx`,
   `Footer.tsx`, `EnquiryButton.tsx`, `WhatsAppCardButton.tsx`, and `app/policies/page.tsx` still
   import the static `siteConfig` from `config/site.ts` directly for some of that same data. An
   admin editing contact/nav/social info in `/admin/settings` will **not** see it reflected in
   every place it logically should.
2. **`data/{categories,playArea,products}.ts`** are fully dead for the running app — confirmed by
   grep, the only remaining importer is `scripts/seed.ts`. They should be re-labeled in the repo
   (or moved under `scripts/` conceptually) as "legacy seed fixtures," not "the data layer,"
   because `types/index.ts`'s file-header comment still frames `/data` + `/lib` as *the* data
   layer with no mention that Supabase now backs almost everything.

**Write path:** all writes are either (a) the one public enquiry insert, or (b) an admin Server
Action — both funnel through the repository layer or a direct Supabase client call, then
`revalidatePath()` the affected public route(s) so ISR-cached pages refresh immediately rather than
waiting out their 60s window.

**Seed duplication:** two independent seeding mechanisms exist — `supabase/seed.sql` (idempotent
SQL, the documented/supported path per `SUPABASE_SETUP.md`) and `scripts/seed.ts` (a TypeScript
script sourced from the legacy `data/*.ts` + `lib/hero.ts` + `config/site.ts`, run via ad hoc
`npx tsx`, not wired into `package.json`). Both seed an overlapping set of tables from divergent
sources — a maintenance/consistency risk if one is updated without the other.

---

## 12. Performance Review

**Good:**
- Rail/list components are Server Components → zero client JS for content that doesn't need it.
- `SafeImage`/`next/image` used almost everywhere with `fill` mode; images route through Next's
  optimizer except SVGs (deliberately bypassed for a real sniffing bug, see §14 history).
- ISR (`revalidate = 60`) on the highest-traffic pages, with `revalidatePath()` on every admin
  write for immediate freshness — a solid "fast but not stale" pattern.
- `getImagesByProductIds()` batches product-image lookups (one query for N products, not N).
- React `cache()` de-duplicates repeated repository calls within a single render pass for
  categories/about/settings.

**Concerns:**
- **`lib/playArea.ts` has no `cache()`** — `getPlayAreaHero()`, `getPlayRules()`, `getPlaySeo()`
  each independently re-query the same `play_area` singleton row; on `/play-area` this is a small
  but avoidable N+1 within one request.
- **`app/categories/page.tsx`** pre-renders a full `ProductGrid` per category (plus "all") on the
  server, sending N+1 grids' worth of markup to the client filter component even though only one
  is visible at a time — will not scale gracefully as category/product counts grow; a client-side
  fetch-on-filter-change (or server-driven query param) would be more efficient at scale.
- **Admin list pages compute counts/joins in JavaScript over full-table fetches** rather than SQL
  aggregates — e.g. Products-per-category counts on the Categories list page, category-name joins
  on the Products list page. Fine today (single/low-hundreds rows per the seed data), but will not
  scale without pagination + server-side aggregation.
- **No pagination anywhere** — every "get all" repository function returns the entire table. Not a
  problem at current catalogue size (6 seeded products; presumably still small in production) but
  worth flagging before the catalogue grows into the hundreds/thousands.
- No CDN/edge caching strategy documented beyond Next's own ISR; no explicit `Cache-Control`
  headers reviewed on the one API route.
- No bundle-size/Lighthouse pass evidenced in any of the docs.

---

## 13. Security Review

**Strong points:**
- RLS is genuinely the enforcement layer (verified by execution per `docs/QA_STABILIZATION_REPORT.md`
  — anonymous/viewer writes to protected tables are correctly rejected at the database, not just
  hidden in the UI).
- Service-role key (`SUPABASE_SERVICE_ROLE_KEY`) is server-only, never referenced in any
  `NEXT_PUBLIC_*` variable, and the Dockerfile explicitly documents injecting it only at runtime,
  never as a build arg.
- Storage buckets: public-read is intentional (product/marketing images), but insert/update/delete
  correctly require `is_staff()`; verified by execution (anonymous upload correctly `403`s).
- `next.config.js`'s SVG handling neutralizes the classic SVG-XSS vector
  (`contentDispositionType: 'attachment'`, restrictive CSP, `script-src 'none'`) even though
  `dangerouslyAllowSVG` is enabled.
- `middleware.ts` fails closed (503, not a crash/bypass) if Supabase env vars are absent.

**Weaknesses / findings:**
1. **Weak email validation** on `/api/enquiries` (`email.includes('@')`) — would accept almost any
   string containing an `@`. Low severity (it's a lead-capture field, not an auth credential) but
   worth tightening with a real regex or a validation library (zod, as `docs/BACKEND_READINESS.md`
   already recommended and was never implemented).
2. **No rate limiting / spam protection** on the public enquiry endpoint or WhatsApp-attribution
   fire-and-forget call — `docs/AUDIT.md` explicitly flagged this as a "when backend lands" TODO;
   it landed, and the TODO was not revisited.
3. **`viewer` role is a defined but functionally meaningless RLS tier** — combined with the
   Enquiries module's actions not checking `{ error }`, a `viewer` gets **false success feedback**
   on writes that are silently blocked by RLS (see §14) — a real UX/trust bug, not an actual
   privilege escalation (confirmed by the QA report's own careful re-verification against
   ground-truth service-role queries).
4. **No admin UI for managing `profiles`/roles** — role promotion is SQL-only (documented in
   `SUPABASE_SETUP.md`), meaning ongoing staff management depends on direct database access rather
   than the app itself; also no audit trail of role changes since `audit_log` is never written to.
5. **`audit_log` table exists, is RLS'd, but nothing in the codebase ever inserts into it** — the
   accountability feature `docs/ARCHITECTURE.md` designed for multi-staff safety was never wired
   up. Any admin content change today is untracked beyond `updated_at` timestamps.
6. **No CSRF-specific handling reviewed** on the one POST API route — Next.js Server Actions have
   built-in CSRF protections, but the raw route handler (`/api/enquiries`) doesn't show any
   explicit origin/CSRF check; risk is low (it only creates a lead record, not a state-changing
   action against sensitive data) but worth a conscious note.
7. **`redirects` table is schema-only** — not consumed by `middleware.ts` or any route, so it
   provides no actual protection against broken links from slug changes despite existing in the
   security/ops design.

---

## 14. Issues & Bugs Found

Ranked roughly by real-world impact (subagent-verified against actual current code, not just the
older docs):

1. 🔴 **Enquiries CRM actions silently "succeed" for `viewer` role.** `app/admin/(protected)/
   enquiries/actions.ts`'s `setStatus`/`assignEnquiry`/`addNote`/`markConverted`/`markLost` (a)
   gate on plain `requireStaff()` (viewer-and-up) instead of `requireStaff('editor')` like every
   other module, and (b) never check `{ error }` from their Supabase calls. Since the database's
   `is_staff()` RLS predicate is admin/editor-only, a signed-in `viewer` who uses this UI will see
   a green success toast (`ActionForm` only reports failure if the action *throws*) while the
   write is silently dropped by RLS. Fix: gate at `requireStaff('editor')` and/or surface
   `{ error }` as a thrown `Error` like every sibling `actions.ts` already does.

2. 🟠 **Testimonials feature is half-removed, not fully removed.** The `testimonials` DB table,
   its RLS policies, its Storage bucket, and its seed rows are all fully live; `TestimonialForm.tsx`
   and the 4 related Server Actions and 2 admin routes (`about/testimonials/{new,[id]}`) all still
   compile and function — but no admin nav link or listing UI reaches them anymore, and no
   storefront section renders `getTestimonials()`. `docs/QA_STABILIZATION_REPORT.md` claims the
   "full admin CRUD block" was removed — it wasn't; only the *entry point* was. Needs a product
   decision: finish the removal (delete table/bucket/routes/actions/component) or restore the nav
   link.

3. 🟠 **`PopularToys.tsx` doesn't hide when empty**, unlike its near-identical siblings
   `NewArrivals.tsx`/`FeaturedProducts.tsx` (both `return null` on zero results). If there are no
   `popular`-flagged products, the homepage will show a "Most Popular / View All →" header with an
   empty grid beneath it — almost certainly an oversight given how structurally identical the
   three components are.

4. 🟡 **`play_area` admin `icon` field is stale.** `FeatureForm.tsx` had its `icon` input removed
   (per the QA report), but `play-area/actions.ts`'s `parseFeature()` still reads `icon` from the
   form (always `null` now, silently clearing any pre-existing value on every save) and
   `play-area/page.tsx` still renders `{f.icon}` in the features list — a field that displays
   legacy data but can never be edited again through the UI.

5. 🟡 **`config/site.ts` vs Supabase-backed settings is a partial migration.** `Header`, `Footer`,
   `EnquiryButton`, `WhatsAppCardButton`, and `app/policies/page.tsx` still read the static
   `siteConfig` object directly for contact/nav/social data that Supabase now also owns via
   `contact_information`/`navigation_links`/`social_links`. Editing these in `/admin/settings` will
   not propagate everywhere it visually should — since `/admin/settings` only exposes footer text
   + contact info, not nav/social links, there isn't even a way to edit navigation/social links
   through the admin UI today despite the schema/repository supporting it.

6. 🟡 **Schema/migration drift**: `about_page.story_title`/`story_image` exist in `schema.sql` and
   `database.types.ts` but in **no migration file** — running the 7 migrations in order would not
   reproduce `schema.sql` exactly. Needs either a missing migration written and committed, or the
   columns removed from `schema.sql` if they're actually unused.

7. 🟡 **Two independent, divergent seed mechanisms** (`supabase/seed.sql` vs `scripts/seed.ts`,
   the latter unwired from `package.json` and depending on an undeclared `tsx` devDependency)
   covering overlapping tables from different source data — a consistency risk if one is updated
   without the other.

8. 🟡 **Duplicate WhatsApp logic** — `EnquiryButton.tsx` and `WhatsAppCardButton.tsx` both hardcode
   the same SVG icon path data and the same `wa.me` URL-building/digit-stripping logic. Candidate
   for extraction into a shared helper + icon component.

9. 🟢 **Minor duplications:** `OffersGrid.tsx` and `app/offers/page.tsx` independently call
   `getProductsOnOffer()` with the same empty-state message; `products/actions.ts` reimplements
   `str`/`num`/`bool`/`commaList`/`lineList` instead of importing the shared versions every other
   module's `actions.ts` uses from `lib/admin/form.ts`; `DeleteCategoryButton`/`DeleteProductButton`
   are near-identical wrapper components; `ImageUploadField`/`CategoryImageField`/`ImageManager`
   share substantial (but not quite identical) upload/crop boilerplate.

10. 🟢 **`canWrite(role)`** (`lib/supabase/auth.ts`) is exported but has zero call sites anywhere —
    dead code.

11. 🟢 **`.btn-primary`/`.btn-secondary`** utility classes defined in `globals.css` but never
    referenced — every button inlines Tailwind classes directly instead.

12. 🟢 **Weak email validation** on `/api/enquiries` (`.includes('@')` only) and **`SearchBar`
    silently no-ops** on empty/whitespace submits with no user feedback.

13. 🟢 **`deleteCategory`'s friendly FK-violation error message fires unconditionally** on any
    delete failure, not just the FK-restrict case it's meant to catch — could mask an unrelated
    error (network, RLS) behind a misleading "still has products" message.

14. 🟢 **No route-level `loading.tsx`/`error.tsx`** anywhere in the public route tree — all error
    handling relies solely on `notFound()` calls and the one API route's try/catch.

15. 🟢 **Documentation drift** — `README.md` describes a pre-Phase-1 state (mentions "Shopping
    Cart"/"Payment Integration" as next steps that were never pursued and aren't in scope);
    `docs/ARCHITECTURE.md` describes a 30-table plan that has since diverged (2 tables dropped, 1
    column set added, undocumented drift noted in item 6 above). Both should be updated or
    clearly marked historical so future contributors don't treat them as current.

---

## 15. Missing Features (relative to what the schema/docs already anticipate, or what a
production catalogue site typically needs)

**Already designed but never built:**
- **Admin "Users & Audit" module** — `docs/ARCHITECTURE.md` planned a screen for managing
  `profiles`/roles and viewing `audit_log`; neither exists. Role promotion remains SQL-only.
- **Audit logging** — the table/RLS exist; no code writes to it.
- **Redirects enforcement** — the table exists; `middleware.ts` never consults it, so slug changes
  currently just 404 rather than 301/302ing to the new URL.
- **Business hours display + editing** — seeded and queryable, but no public page renders it and
  no admin screen edits it (Settings only covers footer text + contact info).
- **Navigation/social links admin editing** — repository functions exist; no admin UI surfaces
  them (only editable via direct SQL or the unwired `scripts/seed.ts`).
- **Age-group faceted filtering UI** — `getProductsByAgeGroup()` exists in the repository layer;
  no page/filter chip ever calls it.
- **SEO pages admin editing** (`seo_pages` table) — no admin screen; would need to be edited via
  SQL today.
- **`sitemap.ts` / `robots.ts`** — recommended in `docs/AUDIT.md`, never added.
- **JSON-LD structured data** (Product, LocalBusiness) — recommended, never added.

**Not designed and not present (reasonable production-hardening asks):**
- Automated tests (unit/integration/E2E) — none found anywhere in the repo.
- Rate limiting / spam protection (captcha/honeypot) on the public enquiry endpoint.
- Real email-format validation (or a shared validation library like zod, as recommended in
  `docs/BACKEND_READINESS.md`).
- Email/Slack/WhatsApp **notification on new lead** for staff (currently staff must check the
  dashboard/`/admin/enquiries` manually).
- CSV export of enquiries (mentioned as a goal in `docs/ARCHITECTURE.md`, not implemented).
- Pagination on any admin list or public listing page.
- Draft/scheduled-publish workflow beyond the simple `active`/`starts_at`/`ends_at` fields already
  present on a few tables (hero slides, banners, promotions).
- Analytics/observability (no error tracking, no analytics package found in `package.json`).
- CI pipeline (no `.github/workflows` or equivalent found).

---

## 16. Improvement Roadmap

### High priority
1. Fix the Enquiries actions bug (§14 #1) — gate at `requireStaff('editor')` and surface Supabase
   errors like every other module.
2. Decide and act on Testimonials (§14 #2) — either finish removing it (table, bucket, routes,
   actions, component) or restore its admin entry point. Leaving it half-removed is the worst
   option (confusing for future maintainers, and a working-but-invisible write surface).
3. Fix `PopularToys.tsx`'s missing empty-state guard (§14 #3) — one-line fix, visible bug.
4. Reconcile the schema/migration drift (`about_page.story_title`/`story_image`, §14 #6) — write
   the missing migration or drop the columns.
5. Consolidate the two seed mechanisms (§14 #7) into one supported path (`supabase/seed.sql` per
   `SUPABASE_SETUP.md`'s documented flow), and either wire `scripts/seed.ts` into `package.json`
   with a declared `tsx` dependency or remove it.
6. Add real email validation + basic spam protection (honeypot/rate-limit) to `/api/enquiries`.

### Medium priority
7. Finish the `config/site.ts` → Supabase settings migration (§14 #5, §11) — make Header/Footer/
   EnquiryButton/WhatsAppCardButton/Policies read exclusively from `lib/settings.ts`, and add the
   missing admin UI for navigation/social links so the schema's capability is actually reachable.
8. Fix the stale Play Area `icon` field (§14 #4) — either restore the form input or stop
   reading/rendering it.
9. Add pagination + server-side aggregation to admin list pages (Products/Categories counts) and
   consider a lazier strategy for `/categories`'s N+1 pre-rendered grids as the catalogue grows.
10. Extract the duplicated WhatsApp icon/URL logic (§14 #8) into a shared helper/component.
11. Wire up `redirects` in `middleware.ts`, build the `audit_log` write path into every Server
    Action, and add the "Users & Audit" admin module for role management.
12. Add `app/sitemap.ts` / `app/robots.ts` and JSON-LD structured data (both previously recommended
    in `docs/AUDIT.md`, never implemented).
13. Add `cache()` wrapping to `lib/playArea.ts` to remove the singleton-row N+1.

### Low priority / polish
14. Update `README.md` to reflect the actual current state (remove stale cart/payment "next
    steps"); mark `docs/ARCHITECTURE.md` as historical/superseded by `supabase/schema.sql`.
15. Remove dead code: unused `.btn-primary`/`.btn-secondary` CSS, `canWrite()` helper,
    `products/actions.ts`'s duplicated form-parsing helpers (import from `lib/admin/form.ts`
    instead).
16. Consolidate `DeleteCategoryButton`/`DeleteProductButton` into one generic component; consider a
    shared upload+crop hook to de-duplicate `ImageUploadField`/`CategoryImageField`/`ImageManager`.
17. Add automated tests — start with `lib/*` pure functions (`format.ts`, pricing calc in
    `products.ts`) since they're already side-effect-free and trivial to unit test, then a small
    Playwright smoke suite for the public route tree.
18. Add basic CI (typecheck + build) given none currently exists.
19. Re-pin `typescript` to a Next-14-supported `^5.x` and remove the two TS-6.0.3-specific
    workarounds (`ignoreDeprecations`, `types/assets.d.ts`) once repinned, per
    `docs/FRONTEND_COMPLETION_REPORT.md`'s own recommendation (never acted on).

---

## 17. Project Score

| Dimension | Score /10 | Rationale |
|---|---|---|
| **Architecture** | 8 | Clean repository-facade layering (`data→lib→repositories`), consistent Server/Client Component split, real RLS-backed security model, ISR + on-write revalidation. Loses points for the partial `config/site.ts` migration and a couple of components bypassing the `lib/*` seam directly. |
| **Security** | 7 | RLS genuinely enforced and execution-verified; secrets handled correctly (service-role server-only); SVG/XSS handled thoughtfully. Loses points for the viewer-role silent-failure bug, missing rate-limiting/spam protection, unused audit log, and weak email validation. |
| **Performance** | 7 | Good use of Server Components, ISR, batched image queries, and request-level caching in most of `lib/*`. Loses points for `lib/playArea.ts`'s missing cache, the `/categories` N+1 grid pre-render, and the total absence of pagination anywhere. |
| **Code Quality** | 7 | Consistent naming/patterns across admin modules, well-commented "why" explanations (SafeImage, ISR rationale, testimonial removal note), TypeScript throughout. Loses points for several duplicated helpers/components, one orphaned feature, and the stale `icon` field. |
| **Scalability** | 6 | Fine for the current small catalogue (single/low-hundreds rows); admin list pages and public listing pages have no pagination and rely on client-side/JS-side joins that won't hold up at real scale. |
| **UI/UX** | 7 | Consistent, accessible components (carousel ARIA roles, reduced-motion respect in `StatCounter`, confirm-before-delete, toasts, pending states). Loses points for the inconsistent empty-state handling (`PopularToys`), inconsistent ISR/SEO patterns across similar pages, and the viewer-role false-success UX. |
| **Overall** | **7/10** | A genuinely production-quality, execution-tested small business site with a real (if imperfect) admin CMS — well above the typical "vibe-coded" catalogue site, but with several partial migrations and one real permissions bug that should be closed out before treating it as fully hardened. |

---

## 18. Complete Developer Onboarding Guide

### 1. What you're working on
A Next.js 14 App Router site with two audiences sharing one codebase and one deploy: the public
storefront (anonymous, read-only against Supabase + one enquiry-insert endpoint) and `/admin`
(Supabase-authenticated CMS for staff). There is no cart/checkout — the business goal is lead
generation via WhatsApp + a tracked enquiry form, managed through a small CRM.

### 2. Get it running locally
```bash
npm install
cp .env.example .env.local   # fill in Supabase URL/anon key/service key + WHATSAPP_NUMBER
npm run dev                  # http://localhost:3000, admin at /admin/login
```
Follow `SUPABASE_SETUP.md` step by step for a fresh Supabase project: run `supabase/schema.sql`
once, then `supabase/seed.sql`, create your own admin user in the Supabase dashboard, and promote
it to `role='admin'` via one SQL statement. Middleware fails closed with a clear `503` message if
env vars are missing — that's expected, not a bug, if you haven't set up `.env.local` yet.

### 3. Mental model for "where does X live"
- **Want to change what a page shows?** Start in `app/<route>/page.tsx` — it'll import a handful
  of functions from `lib/*.ts`. Those are the entire read surface; nothing in `app/`/`components/`
  talks to Supabase directly except two documented exceptions (`Promotions.tsx` and
  `app/categories/[slug]/page.tsx`, which call `repositories.*` directly instead of a `lib/*`
  wrapper — a minor, known inconsistency, not a pattern to copy).
- **Want to change what admins can edit?** Find the module under `app/admin/(protected)/<module>/`
  — `page.tsx` (list/settings UI), `actions.ts` (Server Actions, all gated by `requireStaff`),
  `[id]/page.tsx` + `new/page.tsx` (edit/create forms using a shared form component from
  `components/admin/`).
- **Want to change the database?** Add a new file under `supabase/migrations/` with a later
  timestamp, then manually fold the same change into `supabase/schema.sql` (the two must be kept
  in sync by hand — see §7.7 for a case where they drifted) and regenerate
  `lib/supabase/database.types.ts` via `npx supabase gen types typescript --project-id <ref>`.
- **`data/*.ts` is not the data layer anymore** — despite the name, it's dead application code kept
  alive only as `scripts/seed.ts`'s fixture source. Don't add new features by editing it; add a
  Supabase table + repository function instead.
- **`config/site.ts`** still supplies a few build-time brand constants (name, logo, metadata
  defaults in `app/layout.tsx`) but is *also* still read directly by a few components for data that
  should come from Supabase (`lib/settings.ts`) instead — see §14 #5 before adding a new consumer
  of `siteConfig` for contact/nav/social data; prefer `lib/settings.ts`.

### 4. Auth/role model to keep in your head
Three roles (`admin`/`editor`/`viewer`) exist in the `user_role` enum and `profiles.role`, but only
`admin`+`editor` ("staff", via the `is_staff()` SQL helper) can write anything — `viewer` is
effectively read-only-with-dashboard-access today, and has a known unresolved rough edge in the
Enquiries module (§14 #1). RLS is the *real* enforcement; `requireStaff()` in application code is
a UX nicety (better redirects/error messages) layered on top, not the actual security boundary —
don't rely on removing an app-level check as a way to lock something down; check the RLS policy.

### 5. Conventions to follow when adding a new admin module
Copy the shape of an existing simple module (Settings is the smallest, Categories is a good
mid-complexity template): `page.tsx` (Server Component, fetch + list/form), `actions.ts` (each
export starts with `await requireStaff('editor')`, ends with `revalidatePath()` on every affected
route, uses the shared parsing helpers from `lib/admin/form.ts` — don't reinvent them like
`products/actions.ts` did), and a form component in `components/admin/` wrapped in `ActionForm`
(handles pending state + toast automatically — don't build a bespoke submit handler).

### 6. Before you ship a change
- `npx tsc --noEmit` and `npx next build` — both are the actual CI gate today (there is no
  automated pipeline; see §15/§16 for the recommendation to add one).
- If you touched anything Supabase-facing, re-run the relevant flow by hand against a real project
  — the QA report's own methodology (execute, don't just read the code) caught every serious bug
  in this codebase's history; code review alone previously missed the enquiry-persistence bug, the
  image-rendering bug, and the SVG bug.
- If you touch RLS or role checks, test as a `viewer` and as `anon`, not just as `admin` — several
  of the real findings in this report only show up under a lower-privileged role.

### 7. Known rough edges to be aware of before you touch adjacent code
Re-read §14 before working in: the Enquiries admin module (permissions bug), the About module
(orphaned testimonials), the Play Area admin module (stale `icon` field), or any component that
reads `siteConfig` (partial settings migration). These are documented so you don't "fix" them
inconsistently with the rest of the codebase, or accidentally deepen the inconsistency.

---

*End of analysis. No code was modified in the course of producing this document.*
