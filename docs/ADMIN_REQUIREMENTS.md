# Minimagic — Admin Panel Requirements (Phase 7)

_No backend built. This is the spec for what every site feature implies the admin must manage,
mapped to the data models already in `types/index.ts` so the future admin and storefront share
one contract._

---

## Cross-cutting

- **Auth & roles:** Admin / Editor / Viewer. Audit log on every create/update/delete.
- **Media library:** Upload, crop, alt-text, reuse across products/categories/play-area
  (stored under `public/images/uploads/` today; move to object storage later).
- **Draft vs Published** status + scheduled publish on every content entity.
- **Validation** mirrors the TypeScript types so the admin can't emit invalid data.

---

## 1. Products module → `Product`

Manage: Name, **Slug** (auto from name, editable, must be unique), Short Description,
Description, Images (gallery + primary), Category, Subcategory, Price, **Sale Price**,
Age Group, Material, Color, **Stock Status** (`in-stock|low-stock|out-of-stock|pre-order`),
Features ("Why Kids Love It" list), Tags, **Featured** toggle, **Popular** toggle, **New**
toggle, **Related Products** (multi-select by slug), **Display Order**, per-product SEO.

Admin UX: list with search/filter by category & status, bulk feature/unfeature, drag-to-reorder
(`displayOrder`), slug-uniqueness check, image alt-text required.

## 2. Category module → `Category`

Manage: Name, Slug, Description, Image, Banner, Emoji/placeholder, Color (theme), Display Order,
**Featured** toggle, **Offer** (`discount` % + `label`), SEO. Reordering controls homepage rails
and footer automatically (both already read the catalogue).

## 3. Play Area module → `playArea.ts` shapes

Manage: Hero images/slides, Zone gallery (`PlayZone`), **Packages** (`PlayPackage`: name, price,
description, features), Features (trust badges), Timings & Pricing (`PlayInfoBlock`), Events,
Rules, SEO.

## 4. Homepage module

Manage: Hero slides + buttons (`HeroSlide`), Categories section (which/order — via Featured flag),
Featured Products selection, Promotional banners (currently derived from category offers — make
this an explicit, orderable list), Offers, Testimonials (new entity), Footer content, Announcement
bar messages (`siteConfig.announcements`).

## 5. About Us module

Manage: Story blocks, Mission/Vision/Values, Statistics (label/value/suffix), Team members
(name/role/photo), Gallery, SEO. (Currently constants in `app/about/page.tsx` — promote to
`data/about.ts`, then to admin.)

## 6. Enquiry module → `EnquiryPayload`

Manage/triage: Product Enquiries, Play-Area Enquiries, Contact/General leads — all already flow
through `POST /api/enquiries` tagged with `source` + optional `productSlug`. Add: status tracking
(`new|in-progress|closed`), assignee, notes, export CSV, email/WhatsApp notification on new lead.

## 7. SEO module → `Seo`

Per page/entity: Meta Title, Meta Description, Keywords, Open Graph image, Canonical URL.
Global defaults live in `app/layout.tsx`; entity overrides live on `Product.seo` / `Category.seo`.

---

## Suggested admin data model additions (not yet in `types`)

`Testimonial`, `TeamMember`, `AboutContent`, `HomeConfig` (hero slides, featured selections,
promo banners), `Enquiry` (persisted, with status). Add these to `types/index.ts` when the admin
is built so storefront and admin stay type-aligned.
