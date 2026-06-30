# Audit Changelog — Files Created / Modified

## Files created (21)

**Architecture / data**
- `types/index.ts` — domain models (Product, Category, Seo, SearchResult, EnquiryPayload, …)
- `config/site.ts` — brand, contact, nav, footer, socials, announcements
- `data/products.ts` — canonical product catalogue (full schema, 17 products)
- `data/categories.ts` — canonical category catalogue (9 categories)
- `data/playArea.ts` — play zones, features, packages, visit info
- `lib/categories.ts` — category data-access layer
- `lib/search.ts` — global search across products/categories/play-area
- `lib/format.ts` — price + slug helpers

**Components**
- `components/ProductCard.tsx` — reusable product card → `/products/[slug]`
- `components/ProductGrid.tsx` — responsive grid + empty state
- `components/SearchBar.tsx` — functional search input → `/search`
- `components/SearchResults.tsx` — `/search` results (Suspense client island)
- `components/EnquiryButton.tsx` — working "Send Enquiry" modal → API

**Routes / pages**
- `app/products/[slug]/page.tsx` — product detail (SSG + metadata)
- `app/products/page.tsx` — all-products listing
- `app/categories/[slug]/page.tsx` — category landing (SSG + metadata)
- `app/search/page.tsx` — search page
- `app/contact/page.tsx` — contact + enquiry
- `app/policies/page.tsx` — privacy / terms / cookies
- `app/not-found.tsx` — branded 404
- `app/api/enquiries/route.ts` — enquiry submission seam (POST)

**Docs**
- `docs/AUDIT.md`, `docs/ADMIN_REQUIREMENTS.md`, `docs/BACKEND_READINESS.md`, `docs/CHANGELOG-AUDIT.md`

## Files modified (12)

- `lib/products.ts` — rewritten as data-access layer (was `SAMPLE_PRODUCTS` array)
- `app/layout.tsx` — metadataBase, title template, OG/Twitter defaults
- `app/page.tsx` — client → **server component**
- `app/offers/page.tsx` — client → **server component**, uses data layer
- `app/categories/page.tsx` — data-driven, slug links, reusable grid
- `app/play-area/page.tsx` — data-driven + packages + working enquiry CTAs
- `components/Header.tsx` — config-driven nav, functional search, mobile menu
- `components/Footer.tsx` — client → server, all links live (no `href="#"`)
- `components/Categories.tsx` — data-driven, slug links
- `components/PopularToys.tsx` — data layer + ProductCard, fixed "View All"
- `components/NewArrivals.tsx` — data layer + ProductCard, fixed "View All"
- `components/Promotions.tsx` — "Explore" buttons → real category links
- `components/OffersGrid.tsx` — data layer + ProductGrid

## Verification

- `npx tsc --noEmit` → clean for all application code. (Pre-existing, benign: tsconfig option
  deprecations under TS 6.0.3, and the `globals.css` side-effect import which `next build`
  resolves natively but standalone `tsc` does not.)
- Full `next build` pending — requires pausing the running `npm run dev` (it locks `.next`).
