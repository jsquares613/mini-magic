# Mini Magic — Final Architecture Review (pre-implementation)

Reviewed as **Solution Architect + Database Architect + Product Manager + Store Owner** against the
real business goal: a **physical toy store + play area** whose website does **catalogue, discovery,
enquiry/lead generation, and play-area promotion** — **not** ecommerce checkout. Audience context
assumed: India (₹, WhatsApp-first), non-technical store staff as admins.

**Verdict:** The architecture is technically sound and the repository seam is excellent. But it is
**over-built in ecommerce-flavoured places** and **under-built exactly where the business makes money
— lead management and lead capture.** Fix the P0 items below before writing any SQL.

---

## P0 — Must fix before implementation

### P0-1. Lead/enquiry management is too thin (this IS the product)
Enquiries are the conversion event, yet the table is a contact-form dump. A store owner cannot run
follow-ups or measure ROI with `status in (new, contacted, closed)` alone.

**Add to `enquiries`:** `assigned_to` (FK profiles), `contacted_at`, `outcome` (converted / lost),
`outcome_reason`, `estimated_value` (₹, optional), `preferred_contact` (phone/whatsapp/email),
`channel` (web_form / whatsapp), and attribution: `source_page` (URL), `referrer`, `utm_*`.
**Add table `enquiry_notes`** (id, enquiry_id, note, created_by, created_at) — a follow-up log
("called 14 Jun, visiting Sat"). One status field can't capture a sales conversation.

**Statuses (recommended):** `new → contacted → in_progress → converted` and a terminal `lost`
(with reason). **`converted`** is the field that proves the website drives store visits/sales —
without it the owner can't justify the site.

**Play-area enquiries need structure** (party bookings = real revenue): `preferred_date`,
`children_count`, `package_id` (FK play_area_packages). Put type-specific extras in a
`metadata jsonb` rather than free text so staff see them as fields.

### P0-2. WhatsApp-first lead capture is missing
For this audience, a pre-filled **WhatsApp deep link** ("Hi, I'm interested in *Classic Teddy Bear*
— <url>") converts far better than a form. Make WhatsApp the **primary** product/play-area CTA, form
secondary. Record `channel` on the enquiry. This is the single highest-leverage lead-gen change and
it costs almost nothing.

### P0-3. Two "featured" mechanisms and two "offer" mechanisms = confusion + bad data
- **Featured:** `products.featured` **and** `homepage_featured_products` both exist. Staff won't know
  which one "features" a product. **Pick one.** Recommendation: keep the `featured` boolean (simple
  toggle in the product form) and **drop `homepage_featured_products`** unless manual drag-ordering on
  the homepage is a hard requirement — if it is, drop the boolean instead. Never both.
- **Offers:** `products.sale_price` discounts a product, but `category_offers.discount_percentage`
  does **not** actually change any product price in the current frontend — it only renders a banner.
  So a staffer who sets "Toys = 40% off" will be confused when product cards don't show 40% off.
  **Decide the offer model:** either (a) category offer auto-applies to its products' display price,
  or (b) keep offers per-product via `sale_price` and treat `category_offers` as **marketing copy
  only** (rename to `category_promotions`, drop the misleading `discount_percentage`). Document the
  precedence rule explicitly.

### P0-4. Admin-managed content + SSG = stale or 404 pages
Product/category pages use `generateStaticParams` (SSG). When staff add/edit a product, that page
**won't exist / won't update until a rebuild.** This will look "broken" to non-technical staff.
**Decide now:** on-demand revalidation (`revalidateTag`/`revalidatePath` called from admin saves) or
switch product/category routes to dynamic/ISR (`revalidate = N`). Recommendation: ISR with a short
revalidate **plus** on-demand revalidation on save. This must be designed in, not bolted on.

### P0-5. Price model assumes ecommerce
`price numeric not null default 0` forces a price on every product. A physical store may want to
**hide price** ("Enquire for price"), show MRP only, or run in-store-only pricing. **Make `price`
nullable** and add `price_display` (`show` / `hide` / `enquire`) — per product, with a global default
in settings. This keeps the catalogue honest and supports the "drive an enquiry" goal.

---

## P1 — Strongly recommended

### P1-1. Product discovery for a TOY store = filter by AGE and price
Parents shop by **child's age** first. `age_group` is free text → not filterable. Make it a
**controlled list** (enum or `age_groups` lookup: 0–1, 1–3, 3–5, 5–8, 8–12, 12+) so category pages
can offer **age filters** and price-range filters. This is the most important discovery feature for
this specific business and it's currently impossible.

### P1-2. Physical-store essentials are missing
- **Business hours + location** are not modelled (only `contact_information` with a flat address).
  Add `business_hours` (day, open, close, closed flag) and treat store location as first-class.
- **Local SEO:** add `LocalBusiness` / `Store` JSON-LD (name, address, geo, hours, phone). For a
  physical store, Google Business + local structured data drives more footfall than meta tags.

### P1-3. SEO is modelled for developers, not staff
Staff don't understand meta title/description/canonical/OG. Recommendations:
- **Auto-generate** SEO from name + category + description; only let staff **override** with live
  char-count + Google/WhatsApp preview.
- **Hide** `canonical` (auto-derive from slug) and advanced fields behind an "Advanced" toggle.
- **Add `og_image` to `products` and `categories`** (currently only `seo_pages` has it) — product OG
  images are what render when a product link is shared on WhatsApp/social. Critical for lead gen.
- Add a per-entity **`noindex`** boolean to keep thin pages out of Google.

### P1-4. Trim ecommerce over-engineering
- **`stock_status` 4-enum** (`in_stock/low_stock/out_of_stock/pre_order`) is checkout thinking and
  will drift from physical reality, creating staff burden and customer disappointment. **`pre_order`
  is meaningless without checkout.** Reduce to a single `available boolean` (or 2-state) — or drop it
  and let enquiries handle availability.
- **Subcategories** (`parent_id` + `products.subcategory_id`) are premature for 9 categories, and
  there's an **integrity hole**: nothing forces `subcategory_id`'s parent to equal `category_id`
  (a product could be Toys → "Handbags"). **Defer subcategories**, or enforce with a trigger.
- **`homepage_sections.config jsonb`** and **`play_area.timings/pricing jsonb`** push raw JSON onto
  non-technical staff. Replace with explicit form fields / small child tables (`play_area_timings`,
  `play_area_pricing`).

### P1-5. Missing tables worth adding now
- **`testimonials`** (name, quote, rating, photo, active, order) — trust = leads. (Admin doc
  references it; schema omits it.)
- **`redirects`** (from_path, to_path, created_at) — when staff rename a product, the old URL 404s
  and loses SEO/shared links. A redirect table preserves both.
- **`audit_log`** (actor, table, row_id, action, diff, at) — the architecture *claims* an audit log
  in admin building blocks but no table backs it. Useful with multiple staff editors.
- **`faqs`** (optional) — deflects repetitive enquiries and adds SEO content.

---

## P2 — Nice to have / future

- **Scheduled activation** (`starts_at`/`ends_at`) on `homepage_hero_slides` and
  `promotional_banners` (already on `category_offers`) → seasonal Diwali/Christmas/birthday swaps
  without a developer.
- **Dashboard ROI metrics:** enquiries this week vs last, top products by enquiries, conversion rate
  — not just raw counts. This is what the owner actually wants to see.
- **Search at scale:** current search ships the whole catalogue to the browser and filters client-side
  — fine for tens of products, move to Postgres `pg_trgm`/full-text past a few hundred.
- **Multi-product "shortlist & enquire"** so a parent can enquire about several toys at once.
- **`media_assets`** central library if image reuse across entities becomes common (otherwise
  Supabase Storage + per-row URLs is fine).
- **i18n risk:** text columns are single-language; if Hindi/regional is ever needed, plan a
  translations strategy. YAGNI for launch — just flagged.
- **`product_variants`:** a toy in 3 colours is currently 3 products or one `color` string. Consider a
  simple `color_options text[]` if "available in X colours" matters; avoid full variant tables (no checkout).

---

## Answers to the special-focus questions

### Product Management — can non-technical staff do it?
| Task | With current design | Gap / fix |
|---|---|---|
| Add / Edit product | ✅ form over `products` | Make `price` optional (P0-5); `age_group` a dropdown (P1-1) |
| Upload images | ✅ `product_images` + Storage | Enforce exactly one primary (partial unique index on `is_primary`); drag-reorder UI |
| Mark featured | ⚠️ two mechanisms | Resolve P0-3 — one toggle |
| Mark popular / new | ✅ booleans | Fine |
| Manage offers | ⚠️ confusing | Resolve P0-3 — `sale_price` per product with clear "was/now"; clarify category offer = banner only |

### Category Management — without confusion?
Mostly yes (CRUD, banner, `display_order` drag). **Confusions to remove:** category offer that
doesn't actually discount products (P0-3); subcategory parent/child + two FK columns (P1-4). Drag-to-
reorder must write `display_order` for staff (no number typing).

### Homepage Management — without a developer?
Partially. Hero slides ✅, section enable/disable/reorder ✅. **Blockers for staff:** `config jsonb`
(P1-4) and the dual featured mechanism (P0-3). Add scheduling (P2) for seasonal changes. With those
fixed, yes — fully staff-manageable.

### Enquiry Management
**Store these:** name, phone, email, preferred contact + channel (web/WhatsApp), enquiry type,
related product/package, subject, message, **source page + UTM/referrer**, status, **assigned_to,
contacted_at, outcome (+reason), estimated value**, timestamps, and a **notes/activity log**.
**Types:** ✅ product, ✅ play-area (with date + #children + package), ✅ general/contact — all three,
as asked. **Statuses:** `new → contacted → in_progress → converted | lost(reason)` (richer than
new/contacted/closed; `converted` proves ROI).

### SEO — without understanding technical SEO?
Not yet. Make it **auto-by-default, override-optional**: generate titles/descriptions, show
char-count + live preview, hide canonical/advanced, add per-product/category **OG image** and
**noindex** (P1-3). Then staff manage product/category/page SEO safely without knowing what a
canonical tag is.

---

## Summary of recommended schema deltas
**Add:** `enquiry_notes`, `testimonials`, `redirects`, `audit_log`, `business_hours`,
`play_area_timings`, `play_area_pricing`, (optional `faqs`, `media_assets`, `age_groups`).
**Modify:** `enquiries` (+attribution/outcome/assignment/metadata, richer status); `products`
(`price` nullable + `price_display`, `og_image`, `noindex`, controlled `age_group`, simplify
`stock_status`); `categories` (`og_image`, `noindex`); `homepage_hero_slides` + `promotional_banners`
(+scheduling).
**Remove / defer:** one of {`products.featured`, `homepage_featured_products`}; `homepage_sections.config`
(→ typed fields); subcategories (defer or add integrity trigger); `stock_status` extra states;
`category_offers.discount_percentage` if offers stay per-product.

---

## Three decisions the owner must make before SQL
1. **Show prices?** always / hide / "enquire for price" (drives P0-5 + offer model).
2. **Offer model:** category-wide auto-discount, or per-product sale price only? (drives P0-3).
3. **Featured products:** simple toggle, or hand-ordered homepage list? (pick one, P0-3).
Plus confirm the two earlier opens: admin in the same app (✅ recommended) and admin-only auth (✅).
