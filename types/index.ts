/**
 * Centralised domain models for the Minimagic storefront.
 *
 * These types are the contract between the data layer (`/data`, `/lib`) and the
 * UI (`/components`, `/app`). When a real backend is introduced, only the data
 * source needs to change — as long as it returns these shapes, the entire UI
 * keeps working untouched. Keep this file framework-agnostic (no React imports).
 */

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order'

/** SEO metadata, attachable to any content entity (product, category, page). */
export interface Seo {
  metaTitle: string
  metaDescription: string
  keywords?: string[]
  ogImage?: string
  canonical?: string
}

/**
 * A single sellable product. `images` holds real image URLs once available;
 * until then `emoji` + `bg` render a friendly placeholder so the UI works with
 * zero assets. `category`/`subcategory`/`relatedProducts` reference other
 * entities by **slug** (not object refs) so the data stays serialisable and
 * trivially backend-mappable.
 */
export interface Product {
  id: string
  slug: string
  name: string
  description: string
  shortDescription: string
  price: number
  /** Sale price in the same currency; `null` when not on offer. */
  salePrice: number | null
  /** Category slug (see {@link Category.slug}). */
  category: string
  /** Optional subcategory slug. */
  subcategory?: string
  /** Real image URLs. May be empty — UI falls back to {@link Product.emoji}. */
  images: string[]
  /** Placeholder visual used when `images` is empty. */
  emoji?: string
  /** Tailwind background class for the placeholder tile. */
  bg?: string
  ageGroup: string
  material: string
  color: string
  stockStatus: StockStatus
  isFeatured: boolean
  isPopular: boolean
  isNew: boolean
  tags: string[]
  /** "Why kids love it" bullet list. */
  features: string[]
  /** Slugs of hand-picked related products (optional curation). */
  relatedProducts: string[]
  /** Lower numbers sort first within a listing. */
  displayOrder: number
  seo?: Seo
}

/** Derived view of a product with the effective price already resolved. */
export interface ProductWithPricing extends Product {
  effectivePrice: number
  isOnSale: boolean
  discountPercent: number
}

export interface CategoryOffer {
  discount: number
  label: string
}

export interface Subcategory {
  id: string
  categoryId: string
  name: string
  slug: string
  emoji: string
  displayOrder: number
}

/** A storefront category used for navigation, filtering and landing pages. */
export interface Category {
  id: string
  slug: string
  name: string
  description: string
  /** Real banner/image URL (optional). */
  image?: string
  banner?: string
  /** Placeholder visual. */
  emoji: string
  /** Tailwind background class for the placeholder tile. */
  color: string
  displayOrder: number
  isFeatured: boolean
  offer?: CategoryOffer | null
  seo?: Seo
}

export interface PlayZone {
  id: string
  name: string
  description: string
  image: string | null
}

export interface PlayInfoBlock {
  icon: string
  title: string
  lines: string[]
}

export interface AboutStatistic {
  id: string
  label: string
  value: number
  suffix: string
}

export interface TeamMember {
  id: string
  name: string
  designation: string
  image: string | null
  bio: string
}

export interface AboutGalleryItem {
  image: string
  label: string
}

export interface Testimonial {
  id: string
  authorName: string
  authorRole: string
  quote: string
  rating: number | null
  image: string | null
}

/** A single search result, normalised across content types. */
export interface SearchResult {
  type: 'product' | 'category' | 'play-area'
  title: string
  subtitle: string
  href: string
  emoji?: string
  image?: string
}

/** Payload submitted from any enquiry form (product, play-area, contact). */
export interface EnquiryPayload {
  name: string
  email: string
  phone: string
  message: string
  /** What the enquiry is about, e.g. a product name or "General". */
  subject: string
  /** Origin of the enquiry for admin triage. */
  source: 'product' | 'play-area' | 'contact'
  /** Optional product slug when source === 'product'. */
  productSlug?: string
}
