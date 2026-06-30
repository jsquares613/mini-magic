# Minimagic — Frontend Audit & Production-Readiness Report

_Senior Next.js architecture pass. Covers what was broken, what was built, and the new architecture._

---

## 1. Architecture (before → after)

**Before:** Next.js 14 App Router with 5 pages. Product data duplicated across 4 files,
categories across 3 (with conflicting spellings), all links/CTAs hardcoded inline. No
types, no config layer, no data-access layer, no product detail page.

**After:** Layered, backend-ready architecture with a single source of truth per domain:

```
config/site.ts        → brand, contact, nav, footer, socials (1 source)
types/index.ts        → domain models (Product, Category, Seo, EnquiryPayload, …)
data/                 → canonical catalogues (products, categories, playArea)
lib/                  → data-access layer ("repository") + search + formatters
components/            → presentational, reusable UI (ProductCard, ProductGrid, …)
app/                  → routes (pages + /api seam)
```

**Rule:** UI never imports `data/*` directly — it goes through `lib/*`. That indirection
is the backend seam (see `docs/BACKEND_READINESS.md`).

---

## 2. Broken functionality found (and fixed)

| # | Location | Problem | Fix |
|---|----------|---------|-----|
| 1 | `categories/page.tsx` | Product cards were plain `<div>` — not clickable | Now `ProductCard` → `/products/[slug]` |
| 2 | `PopularToys`, `NewArrivals`, `OffersGrid` | Linked to `/product/{id}` — route never existed (404) | New `/products/[slug]` route + shared `ProductCard` |
| 3 | `PopularToys` "View All" | `/toys` — 404 | → `/products` |
| 4 | `NewArrivals` "View All" | `/new` — 404 | → `/products` |
| 5 | `Categories` (home) | Linked to `/categories/house%20hold` etc. — 404 | Slug-based links → `/categories/[slug]` (real pages) |
| 6 | `Promotions` "Explore" ×2 | Inert `<button>` | Real `<Link>` to category pages (data-driven) |
| 7 | `Header` search | Input + button did nothing | `SearchBar` → `/search?q=` |
| 8 | `Footer` categories ×8 | All `href="#"` | Generated from category catalogue |
| 9 | `Footer` socials ×4 | All `href="#"` | Real URLs from `siteConfig` |
| 10 | `Footer` legal ×3 | All `href="#"` | → `/policies#privacy|#terms|#cookies` |
| 11 | `play-area` "Book a Visit" | `/contact` — 404 | `/contact` page built + enquiry modal |

**Result: zero dead links, zero placeholder actions across the site.**

---

## 3. Missing routes / pages — now created

| Route | Purpose | Rendering |
|-------|---------|-----------|
| `/products/[slug]` | Product detail (image, specs, "Why Kids Love It", enquiry, related) | SSG (`generateStaticParams`) |
| `/products` | Full product listing ("View All") | Static |
| `/categories/[slug]` | Category landing + product grid | SSG |
| `/search` | Global search results (`?q=`) | Dynamic (Suspense) |
| `/contact` | Contact details + enquiry | Static |
| `/policies` | Privacy / Terms / Cookies (anchored) | Static |
| `/api/enquiries` | Enquiry submission seam (POST) | Route handler |
| `not-found` | Branded 404 | Static |

Existing pages refactored: `/` (now server component), `/categories`, `/offers` (now server),
`/play-area` (data-driven + packages), `/about` (unchanged, already sound).

---

## 4. Hardcoded data — now centralized

- **Products:** 4 divergent copies → one catalogue `data/products.ts` (full schema).
- **Categories:** 3 inconsistent copies → one catalogue `data/categories.ts`
  (fixed "Stationary"→"Stationery", "House Hold"→"Household").
- **Play Area:** inline arrays → `data/playArea.ts` (also feeds search).
- **Site/brand/nav/footer/contact/socials/announcements:** → `config/site.ts`.

---

## 5. Product system implementation

`Product` schema (all requested fields): `id, slug, name, description, shortDescription,
price, salePrice, category, subcategory, images, ageGroup, material, color, stockStatus,
isFeatured, isPopular, isNew, tags, features, relatedProducts, displayOrder, seo`.

- `images: string[]` for real assets; `emoji` + `bg` render a placeholder until assets exist.
- Detail layout is **data-driven and reusable** — no per-product hardcoded markup.
- Related products: curated slugs first, then auto-filled from the same category (never empty).

---

## 6. Search implementation

`lib/search.ts → searchSite(query)` returns a normalized `SearchResult[]` across
**products, categories and play-area** content. `SearchBar` (header + mobile + /search)
navigates to `/search?q=`. To back it with an API later, swap the function body only.

---

## 7. Technical debt identified

- `tsconfig.json` uses options deprecated under the locally-installed TypeScript 6.0.3
  (`baseUrl`, `moduleResolution: node`). Not breaking on Next 14, but pin TS to `^5.x`
  or add `"ignoreDeprecations": "6.0"` to avoid future friction.
- `package.json` pins some `@types/*` and `typescript` to unusually high majors — align
  with Next 14's supported toolchain.
- Product imagery is emoji placeholders; real images should populate `Product.images`.
- No automated tests yet (see recommendations).

---

## 8. Scalability improvements

- Single source of truth per domain → no more data drift.
- Repository pattern (`lib/*`) → storage-agnostic UI.
- SSG via `generateStaticParams` → scales to thousands of products with static delivery.
- Reusable `ProductCard`/`ProductGrid`/`EnquiryButton` → consistent UI, less duplication.

---

## 9. Performance improvements

- Home & Offers converted from Client → **Server Components** (less JS shipped, better SEO).
- `ProductCard`/`Footer`/`Categories` are server components (zero client JS).
- `next/image` with `sizes`/`priority` already used for hero & zones; product images ready
  for the same treatment once assets land.
- Static generation for product/category pages → CDN-cacheable, fast TTFB.

---

## 10. Security considerations

- `/api/enquiries` validates payload shape and rejects malformed input (400/422).
- Social links use `rel="noopener noreferrer"`.
- When backend lands: add rate-limiting + spam protection (captcha/honeypot) to enquiries,
  server-side validation (zod), and never trust client price/availability — re-resolve on server.

---

## 11. SEO recommendations (partly implemented)

- ✅ `metadataBase` + title template + OG/Twitter defaults in `app/layout.tsx`.
- ✅ Per-product & per-category `generateMetadata` from data (`seo` field).
- ⬜ Add `app/sitemap.ts` and `app/robots.ts` (trivial with `getAllProductSlugs`/`getAllCategorySlugs`).
- ⬜ Add JSON-LD `Product` structured data on detail pages.
- ⬜ Populate `seo.canonical` per entity once the production domain is final.

---

## 12. Files created / modified

See `docs/CHANGELOG-AUDIT.md` for the full list (also summarized in the PR/handoff notes).
