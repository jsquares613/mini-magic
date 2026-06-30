# Minimagic — Backend Readiness (Phase 8)

_How the frontend is structured so a future backend (Node/Express/NestJS/Laravel/Supabase/
Firebase/Strapi) can plug in with minimal change._

---

## The seam: a repository layer

The UI **never** imports raw data. It calls functions in `lib/`:

```
data/products.ts  (raw)  ──►  lib/products.ts  ──►  components / app  (UI)
                              ▲
                              └── swap this body for `fetch()` and the UI is untouched
```

Today these functions are pure & synchronous (work in Server **and** Client Components).
To go live, reimplement their bodies to call your API and make them `async`. Because the
detail/category/listing pages are already **async-friendly Server Components**, awaiting the
calls is the only change.

### Example migration (Supabase / REST / Strapi all identical in shape)

```ts
// lib/products.ts — AFTER
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const res = await fetch(`${process.env.API_URL}/products/${slug}`, { next: { revalidate: 60 } })
  return res.ok ? (res.json() as Promise<Product>) : undefined
}
```

The page already does `const product = getProductBySlug(params.slug)` → just add `await`.
No JSX, no component, no type changes.

---

## Separation of concerns (already done)

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Configuration | `config/site.ts` | brand, nav, contact (env-overridable later) |
| Types / contract | `types/index.ts` | shared by storefront **and** future admin/API |
| Data | `data/*` | seed catalogues (replaceable by DB/CMS) |
| Business logic | `lib/*` | pricing, related-products, search, formatting |
| UI | `components/*`, `app/*` | presentation only |

---

## Submission seam (write path)

`POST /api/enquiries` already accepts the final `EnquiryPayload` and validates it. Replace the
"persist (stub)" block with a DB insert / CRM call / email. The client (`EnquiryButton`) needs
**no change**. This same pattern extends to cart/checkout/auth route handlers later.

---

## Recommended next steps to "production backend"

1. **Validation:** add `zod` schemas derived from `types/` (share between client, route handlers, admin).
2. **Env config:** move `siteConfig.url` and API base to `.env` (`NEXT_PUBLIC_*` for client-safe values).
3. **Data source choice:**
   - *Fastest:* Supabase/Firebase — map tables to `Product`/`Category` shapes 1:1.
   - *Headless CMS:* Strapi — model content types to match `types/`, fetch in `lib/`.
   - *Custom API:* NestJS/Express/Laravel exposing `/products`, `/categories`, `/enquiries`.
4. **Caching/ISR:** use `fetch(..., { next: { revalidate } })` or `revalidateTag` for fresh-but-fast.
5. **Images:** populate `Product.images`; configure `next.config.js > images.remotePatterns` for the CDN.
6. **SEO:** add `app/sitemap.ts` + `app/robots.ts` (use `getAllProductSlugs` / `getAllCategorySlugs`)
   and JSON-LD on product pages.
7. **Auth & admin:** build against the same `types/` so storefront and admin never diverge.
8. **Testing:** unit-test `lib/*` (pure functions → trivial to test); add Playwright smoke tests for routes.

---

## Why a rewrite won't be needed

- All reads pass through ~10 small functions in `lib/` — that is the entire change surface.
- All writes pass through `/api/enquiries` (and future route handlers) — server-side, swappable.
- The type contract (`types/index.ts`) is framework-agnostic and already the single shared schema.
