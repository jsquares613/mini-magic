# Phase 1 — Database Foundation (delivered)

Establishes the Supabase/PostgreSQL foundation per `docs/ARCHITECTURE.md` (v2.1).
**Admin panel and frontend wiring are intentionally NOT included** (Phases 2 & 3).

## What was delivered

```
supabase/migrations/
  20260619120000_initial_schema.sql   # extensions, 8 enums, 30 tables, indexes, updated_at triggers
  20260619120100_rls_policies.sql     # is_staff()/is_admin() helpers + RLS for every table
  20260619120200_storage_buckets.sql  # 8 storage buckets + public-read / staff-write policies

lib/supabase/
  client.ts            # getSupabaseClient() [anon, RLS] + getServiceClient() [service role, server-only]
  database.types.ts    # typed Database (hand-authored; regenerate with `supabase gen types`)
  index.ts             # public entry: client + repositories + types
  repositories/
    products.ts        # getAllProducts, getProductBySlug, byCategory, byAgeGroup, popular, new, onOffer, related, slugs
    categories.ts      # getAllCategories, featured, bySlug, slugs, promotions
    homepage.ts        # heroSlides, sections, featuredProducts (curated), promotionalBanners
    playArea.ts        # getPlayArea, gallery, packages, features
    enquiries.ts       # createEnquiry (public) + admin CRM: list, get, status, assign, convert, lost, notes
    settings.ts        # contactInformation, businessHours, navigation, socials, settings, seoPage
    _util.ts           # ok() error-unwrap + isLive() schedule check

scripts/seed.ts        # re-runnable seed from data/* + config/site.ts + lib/hero.ts (single source of truth)

.env.example           # Supabase env vars
```

## Setup (run when ready to provision)

```bash
# 0. Install deps already done: @supabase/supabase-js. Install the CLI + tsx:
npm i -D supabase tsx          # or use the global supabase CLI

# 1. Create a Supabase project, then copy keys into .env.local
cp .env.example .env.local     # fill NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY

# 2. Apply migrations (choose one)
supabase link --project-ref <ref> && supabase db push    # remote
#   or, for local dev:  supabase start && supabase db reset

# 3. Seed from existing project data
npx tsx scripts/seed.ts        # 9 categories, 17 products, 7 age groups, play area, settings…

# 4. Regenerate exact types from the live DB (replaces the hand-authored file)
supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
```

## Repository architecture (the backend seam)

- The UI never touches Supabase directly — it calls **repository functions** whose return
  shapes mirror the current in-memory `lib/*` API. Phase 3 = point the old `lib/*` reads at these.
- **Reads** use the anon client (RLS: public can read the catalogue).
- **Enquiry submit** uses the anon client (RLS: public INSERT only).
- **Admin/CRM** (enquiry list/update, etc.) use the service-role client (server-only).

Usage:
```ts
import { repositories } from '@/lib/supabase'
const product = await repositories.products.getProductBySlug('classic-teddy-bear')
await repositories.enquiries.createEnquiry({ name, phone, enquiry_type: 'product', channel: 'whatsapp', ... })
```

## Verification
- `npx tsc --noEmit` → **clean** (whole project, incl. the new Supabase layer + seed).
- Migrations/seed run against a live Supabase instance (not executed here — no project provisioned).

## Schema highlights (v2.1)
- 30 tables; per-product `price` + `price_display` (show/hide/enquire); `sale_price` is the only discount.
- `available boolean` (no `stock_status`); subcategories deferred; hero/banner scheduling (`starts_at`/`ends_at`).
- `age_groups` + `product_age_groups` (M:N, filterable); curated `homepage_featured_products`.
- Enquiries CRM: status workflow, assignment, notes, attribution, conversion tracking.
- `testimonials`, `redirects`, `audit_log`, `business_hours`; RLS on every table; 8 storage buckets.

## Not in this phase (next up)
- **Phase 2 — Admin panel** (`app/(admin)/admin/**`, Supabase Auth, CRUD, image upload, enquiry CRM UI).
- **Phase 3 — Frontend integration** (delegate `lib/*` to repositories, WhatsApp CTA, ISR/revalidate, middleware redirects).
