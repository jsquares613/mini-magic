# Production QA & Stabilization Report

Every claim below was verified by **execution** against the live Supabase project (not code
inspection alone): live `curl` against the running dev server, direct REST calls against
PostgREST/Storage/Auth with the project's real service-role and anon keys, and a full isolated
`next build`. No new features were added — every change is a bug fix.

---

## Bugs found and fixed

### 1. 🔴 Critical — Enquiries never reached the database
**The single most important bug.** Every "Send Enquiry" CTA (product pages, play-area, contact —
the entire lead-generation purpose of the site) posted to `/api/enquiries`, which only
`console.log`'d the payload and returned success. The `enquiries` table had **zero real rows**
despite the form working from the customer's perspective, and the admin Enquiry CRM had nothing
to ever show.

- **Root cause:** the route handler was left at its Phase-1 stub (written before Supabase existed)
  and never updated when the repository layer was built.
- **Fix:** [app/api/enquiries/route.ts](app/api/enquiries/route.ts) now calls
  `repositories.enquiries.createEnquiry()`. Maps the client's `source` field (`'play-area'`,
  hyphenated) onto the DB enum (`'play_area'`, underscored); resolves `productSlug` → real
  `product_id` via a lookup so the CRM can link enquiries to products; captures the `Referer`
  header into `source_page` (an attribution column that existed in the schema but was never
  populated).
- **Verified:** posted a real enquiry through the live route with a product slug and a `Referer`
  header → confirmed via service-role query that the row persisted with the correct
  `enquiry_type: "product"`, a `product_id` that resolves back to the exact product
  (`classic-teddy-bear`), and `source_page` populated. Also verified the `'play-area'` →
  `'play_area'` enum mapping (a wrong mapping would have thrown a 500 from the enum constraint;
  got 201). Test rows deleted afterward.
- **Files modified:** `app/api/enquiries/route.ts`, `components/EnquiryButton.tsx` (stale comment).

### 2. 🔴 High — `next/image` crashes on every Supabase Storage URL
Exactly the example bug class named in the brief. `next.config.js` had no `images` config, so
the moment any admin uploaded a hero/category/product/banner image, the page rendering it would
throw `Invalid src prop ... hostname "<ref>.supabase.co" is not configured`.

- **Root cause:** missing `images.remotePatterns` for the Supabase Storage public-object endpoint.
- **Fix:** [next.config.js](next.config.js) — `remotePatterns` for `*.supabase.co` scoped to
  `/storage/v1/object/public/**`.
- **Verified:** before the fix, requesting a Supabase-hosted image through `/_next/image` returned
  `"url" parameter is not allowed`. After the fix, the same host returns
  `"url" parameter is valid but upstream response is invalid"` for a nonexistent test path (proving
  the **host** is now accepted), and a **real admin-uploaded hero JPEG already in the live
  database** (`hero/1781939711498-download__6_.jpg`) loads through the optimizer end-to-end:
  `200, 87710 bytes, image/jpeg`.

### 3. 🔴 High — `next/image` rejects every bundled (and most uploadable) SVG
A second, distinct bug in the same code path. Next.js's image optimizer sniffs magic bytes via
its own `detectContentType()` and **only recognizes SVG if the file starts with the literal
`<?xml` declaration**. Every bundled hero SVG in this project starts directly with `<svg ...>`
(perfectly valid SVG per spec — the XML prolog is optional), so the sniffer falls through every
format check, returns no match, and the optimizer 400s with *"The requested resource isn't a
valid image"* — **before** the `dangerouslyAllowSVG` check is even reached, so that flag alone
cannot fix it. Every upload input (`accept="image/*"`) also permits SVG, so any admin-uploaded
SVG logo/banner would hit the identical wall unless its export tool happened to include the XML
prolog — not something an admin can control.

- **Root cause:** confirmed by reading `node_modules/next/dist/server/image-optimizer.js` directly
  — `detectContentType()`'s SVG check is `[0x3c,0x3f,0x78,0x6d,0x6c]` (`<?xml`), with no fallback
  for a bare `<svg` start.
- **Fix:** [components/SafeImage.tsx](components/SafeImage.tsx) — a drop-in replacement for
  `next/image` (fill-mode, matching the only mode this app uses) that renders `.svg` sources as a
  plain `<img>` (styled to match `fill` exactly) and everything else through the real optimizer.
  SVGs gain nothing from raster optimization anyway, so this has no real downside. Swapped into
  all 4 usage sites: `components/Hero.tsx`, `components/ProductCard.tsx`,
  `app/products/[slug]/page.tsx`, `app/play-area/page.tsx`. `next.config.js` also keeps
  `dangerouslyAllowSVG`/`contentDispositionType`/`contentSecurityPolicy` for the (now rare) case a
  valid-by-Next's-rules SVG flows through the optimizer.
- **Verified:** homepage HTML before the fix had no `<img>` tag for the hero SVGs (broken `next/image`
  internals); after the fix, the raw HTML shows
  `<img src="/images/hero section/hero1.svg" ... class="absolute inset-0 h-full w-full object-cover object-center"/>`
  rendering correctly, confirmed via direct fetch of that exact URL (`200`).

### 4. 🟡 Test-methodology correction (not a product bug) — almost reported a false "privilege escalation"
While testing role permissions by execution, a PATCH from an `editor`/`viewer` test session
attempting to set their own `role` to `'admin'` returned `204` — which looks like a successful
privilege escalation. **Verified against the actual database with the service-role key (ground
truth) before reporting it**: the role was unchanged in both cases. The `204` was
`Prefer: return=minimal` masking a `0`-rows-affected RLS-blocked `UPDATE` — standard
PostgREST/RLS behavior, not a vulnerability. Flagging the near-miss because it's exactly the kind
of result that looks alarming at a glance; the fix was re-testing with a request that reveals the
true row count rather than trusting the status code alone.

### 5. 🔴 Critical — Product images never appeared on any list view (cards, rails, related products, offers, category pages)
A real, separate session traced this end-to-end per an explicit follow-up investigation. The
database, storage, and upload flow were all confirmed correct — the bug was entirely in the data
layer's list-mapping function.

- **Root cause:** `toProduct()` in [lib/products.ts](lib/products.ts) hardcoded `images: []` for
  every caller except `getProductBySlug`. This silently affected `getAllProducts`,
  `getProductsByCategory`, `getFeaturedProducts`, `getPopularProducts`, `getNewProducts`,
  `getProductsOnOffer`, and `getRelatedProducts` — i.e. every homepage rail, the category page, the
  offers page, the all-products listing, and the "You may also like" rail. Only the single-product
  detail page happened to populate images correctly, because it built the `Product` object with an
  explicit override after the `toProduct()` call.
- **Verified by direct query** before touching any code: `product_images` had the right rows
  (`is_primary` correctly set on exactly one row) for the one real product with uploads. The bug
  was conclusively in the read path, not the write path.
- **Fix:** added `getImagesByProductIds()` to
  [lib/supabase/repositories/products.ts](lib/supabase/repositories/products.ts) — one batched
  query (not N) returning each product's images ordered primary-first. Threaded it through
  `toProduct`/`toProducts` and the two callers that bypassed `toProducts`
  (`getProductsByCategory`, `getProductBySlug`) in [lib/products.ts](lib/products.ts).
- **Verified by execution, exhaustively:** created a real product via direct insert, uploaded 2
  images to Supabase Storage, set one `is_primary`, flagged it `popular` + gave it a `sale_price`.
  Confirmed its primary image (specifically `qa-0-...`, never the secondary `qa-1-...`) rendered
  as a real `<img src="...">` (not just a string match) on: the homepage Popular rail, its own
  detail page, the Offers page, its category page, the all-products listing, **and** as a
  same-category "related product" filler on a different product's detail page. All 6 surfaces
  confirmed before cleanup.

### 6. 🟠 Medium — Listing pages had no ISR fallback, found while verifying bug #5
Discovered as a side effect of testing #5: a product inserted directly into the database (bypassing
the app's own `revalidatePath()` calls) never appeared on `/`, `/offers`, `/products`, or
`/categories` — **even after a full dev-server process restart** — while `/categories/[slug]` and
`/products/[slug]` (which already had `revalidate = 60`) picked it up correctly. Root cause: Next
14's App Router caches a route's rendered output (and the `fetch()` calls within it, including
Supabase's REST calls) to **disk** (`.next/cache`) by default when no `revalidate`/`dynamic` export
is present — a plain process restart doesn't clear that. The real, supported flow (admin creates
content through the actual admin UI) is unaffected, because those Server Actions already call
`revalidatePath()` explicitly — this only bites content changed by any other path (direct SQL,
scripts, future integrations). Added `export const revalidate = 60` to
[app/page.tsx](app/page.tsx), [app/offers/page.tsx](app/offers/page.tsx),
[app/products/page.tsx](app/products/page.tsx), [app/categories/page.tsx](app/categories/page.tsx)
— matching the pattern already used on the detail/category-detail pages. Verified by clearing
`.next` fully, restarting, and re-confirming all 6 surfaces from bug #5 picked up the change.

---

## Verified working, no changes needed

- **Authentication / route protection:** unauthenticated requests to every `/admin/*` page return
  `307` → `/admin/login`; `/admin/login` itself returns `200`. Confirmed live against the running
  server, not inferred from code.
- **RLS policies, by direct execution against real test accounts** (created via the Auth Admin
  API, exercised, then deleted): anonymous and `viewer` sessions are correctly denied `INSERT` on
  `products`; anonymous `INSERT` on `enquiries` (the one public-write path) is correctly allowed;
  anonymous/`viewer` reads of `enquiries` correctly return zero rows while a staff session sees
  the real row. `is_staff()` is `admin`/`editor` only — `viewer` has no staff-table access (see
  gap below).
- **Storage round-trip:** unauthenticated upload to `product-images` is correctly rejected
  (`403`, RLS policy violation); an authenticated upload succeeds, the public URL serves the
  correct content-type immediately, the image loads through `next/image`, and delete genuinely
  removes the object (confirmed via the Storage API's object list, not just the public URL — a
  transient `200` on the public URL right after delete was edge-CDN cache lag, not a real bug).
- **Database structure:** all 30 tables present; row counts sane and consistent with real admin
  activity already performed this session (hero slides 2→3, featured products 2→3, promotional
  banners 2→3 — proving Homepage admin CRUD genuinely persists).
- **Navigation:** every static `href` cross-checked against the actual `app/**/page.tsx` file
  tree; every dynamic `href={\`...\`}` template checked against its target dynamic route. Zero
  dead links. No placeholder `onClick`/`href="#"` found anywhere.
- **Storefront pages:** `/`, `/products`, `/products/[slug]` (×2 real slugs),
  `/categories`, `/categories/[slug]` (×2), `/offers`, `/play-area`, `/contact`, `/search`
  (bare + query), `/policies`, `/about` — all `200`, live, post-fix.
- **404 handling:** nonexistent product/category slugs correctly return `404`.

---

## Known gap — flagged, not fixed (product decision, not a bug)

**`viewer` role has no defined capability in the current admin build.** `is_staff()` (used by
every content-table RLS policy) is `role in ('admin','editor')` — `viewer` is excluded. A
`viewer` can sign in and reach `/admin` (middleware/`requireStaff()` allow it through), and will
see the dashboard shell and publicly-readable data (products/categories, since those are
`public_read_*` anyway), but any genuinely staff-gated view (`/admin/enquiries`) will render
**silently empty** rather than showing an access-denied message — which could look like a bug
("why is my enquiries list always empty") rather than a permissions boundary. Not fixed here
because the fix requires a product decision (define what `viewer` is for, or remove the role)
rather than a bug correction — flagging per the instruction to stabilize, not extend.

---

## Build verification

```
npx tsc --noEmit   → exit 0, zero errors
npx next build     → exit 0, 23/23 pages generated, 0 errors (1 pre-existing, harmless warning:
                      @supabase/ssr pulls a Node API into the Edge middleware bundle — compiles
                      fine, no runtime failure observed; ESLint not installed, build skips it
                      gracefully — both noted in prior sessions, unrelated to this pass)
```
Build ran in an isolated junction-copy (`C:\mm-build-verify`, cleaned up afterward) against the
**live** Supabase project, with the user's own `npm run dev` left untouched throughout.

---

## Files changed this session

| File | Change |
|---|---|
| `app/api/enquiries/route.ts` | **Critical fix** — actually persists to `enquiries` via the repository |
| `next.config.js` | Added `images.remotePatterns` (Supabase host) + SVG allowlist config |
| `components/SafeImage.tsx` | **New** — `next/image` wrapper that bypasses the SVG sniffing bug |
| `components/Hero.tsx` | Use `SafeImage` instead of `next/image` |
| `components/ProductCard.tsx` | Use `SafeImage` instead of `next/image` |
| `app/products/[slug]/page.tsx` | Use `SafeImage` instead of `next/image` |
| `app/play-area/page.tsx` | Use `SafeImage` instead of `next/image` |
| `components/EnquiryButton.tsx` | Corrected stale "stub" comment |
| `lib/supabase/repositories/products.ts` | **New** `getImagesByProductIds()` — batched image fetch |
| `lib/products.ts` | **Critical fix** — `toProduct`/`toProducts` no longer hardcode `images: []`; `getProductsByCategory` and `getProductBySlug` now route images through the same path |
| `app/page.tsx` | Added `export const revalidate = 60` (ISR fallback) |
| `app/offers/page.tsx` | Added `export const revalidate = 60` |
| `app/products/page.tsx` | Added `export const revalidate = 60` |
| `app/categories/page.tsx` | Added `export const revalidate = 60` |

No RLS or schema changes were needed in either pass — the gaps were in wiring (route handler,
data-layer mapping) and framework/caching configuration, not the database design.
