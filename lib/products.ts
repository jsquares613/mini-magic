import { repositories } from '@/lib/supabase'
import { getCategoryIdToSlugMap, getSubcategoryIdToSlugMap } from '@/lib/categories'
import { getNewArrivalDays } from '@/lib/settings'
import { NEW_ARRIVALS_RAIL_SIZE, isNewArrival } from '@/lib/newArrivals'
import { stockStatusOf } from '@/lib/stock'
import type { Product, ProductWithPricing } from '@/types'
import type { ProductRow } from '@/lib/supabase/repositories/products'

/**
 * Product data-access layer — now backed by Supabase (Phase 3 integration).
 *
 * This is the seam described in docs/ARCHITECTURE.md: callers (pages,
 * components) only ever import from `lib/products.ts`, never `data/products.ts`
 * or the Supabase repository directly. Functions are `async` because reads now
 * go over the network; every caller has been updated to `await` them.
 *
 * `Product.category` is a SLUG (matching the legacy in-memory shape every
 * caller already expects for links/lookups) — `category_id` → slug is resolved
 * via the request-scoped cached map in `lib/categories.ts`, so a list of 50
 * products costs one categories round trip, not fifty.
 */

function toProduct(
  row: ProductRow,
  categorySlug: string,
  /** The `new_arrival_days` setting — decides `isNew`. */
  newArrivalDays: number,
  images: string[] = [],
  subcategorySlug?: string,
): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    shortDescription: row.short_description ?? '',
    price: row.price ?? 0,
    salePrice: row.sale_price,
    category: categorySlug,
    subcategory: subcategorySlug,
    images,
    ageGroup: '',
    material: row.material ?? '',
    color: row.color ?? '',
    stockStatus: stockStatusOf(row),
    isFeatured: false,
    isPopular: row.popular,
    isNew: isNewArrival(row.arrived_at, newArrivalDays),
    promoTag: row.promo_tag ?? null,
    tags: row.tags,
    features: row.features,
    relatedProducts: [],
    displayOrder: row.display_order,
    seo: row.seo_title ? { metaTitle: row.seo_title, metaDescription: row.seo_description ?? '' } : undefined,
  }
}

async function toProducts(rows: ProductRow[]): Promise<Product[]> {
  const [idToSlug, subIdToSlug, imagesByProduct, newArrivalDays] = await Promise.all([
    getCategoryIdToSlugMap(),
    getSubcategoryIdToSlugMap(),
    repositories.products.getImagesByProductIds(rows.map((r) => r.id)),
    getNewArrivalDays(),
  ])
  return rows.map((row) =>
    toProduct(
      row,
      // Storefront reads only see published rows, which always have a category.
      row.category_id ? idToSlug.get(row.category_id) ?? row.category_id : '',
      newArrivalDays,
      (imagesByProduct.get(row.id) ?? []).map((i) => i.image_url),
      row.subcategory_id ? subIdToSlug.get(row.subcategory_id) : undefined,
    ),
  )
}

/** Resolve the effective price + sale metadata for a product. */
export function withPricing(product: Product): ProductWithPricing {
  const isOnSale = product.salePrice != null && product.salePrice < product.price
  const effectivePrice = isOnSale ? (product.salePrice as number) : product.price
  const discountPercent = isOnSale
    ? Math.round(((product.price - (product.salePrice as number)) / product.price) * 100)
    : 0
  return { ...product, effectivePrice, isOnSale, discountPercent }
}

export async function getAllProducts(): Promise<Product[]> {
  return toProducts(await repositories.products.getAllProducts())
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const [detail, newArrivalDays] = await Promise.all([repositories.products.getProductBySlug(slug), getNewArrivalDays()])
  if (!detail) return undefined
  return {
    ...toProduct(
      detail,
      detail.category?.slug ?? detail.category_id ?? '',
      newArrivalDays,
      detail.images.map((i) => i.image_url),
    ),
    ageGroup: detail.ageGroups.map((a) => a.label).join(', '),
  }
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const rows = await repositories.products.getProductsByCategory(categorySlug)
  const [subIdToSlug, imagesByProduct, newArrivalDays] = await Promise.all([
    getSubcategoryIdToSlugMap(),
    repositories.products.getImagesByProductIds(rows.map((r) => r.id)),
    getNewArrivalDays(),
  ])
  return rows.map((row) =>
    toProduct(
      row,
      categorySlug,
      newArrivalDays,
      (imagesByProduct.get(row.id) ?? []).map((i) => i.image_url),
      row.subcategory_id ? subIdToSlug.get(row.subcategory_id) : undefined,
    ),
  )
}

export async function getFeaturedProducts(limit?: number): Promise<Product[]> {
  return toProducts(await repositories.homepage.getFeaturedProducts(limit))
}

export async function getPopularProducts(limit?: number): Promise<Product[]> {
  return toProducts(await repositories.products.getPopularProducts(limit))
}

/** The newest arrivals, newest first — the homepage rail. */
export async function getNewProducts(limit?: number): Promise<Product[]> {
  return toProducts(await repositories.products.getNewProducts(limit))
}

/** The most the New Arrivals page lists. */
const NEW_ARRIVALS_PAGE_MAX = 96

/**
 * The New Arrivals page: every product still within its "new" period, newest
 * first — or, when fewer than a rail's worth are, the latest arrivals anyway, so
 * the page never looks bare between deliveries.
 */
export async function getNewArrivals(): Promise<Product[]> {
  const [rows, days] = await Promise.all([repositories.products.getNewProducts(NEW_ARRIVALS_PAGE_MAX), getNewArrivalDays()])
  const now = Date.now()
  const current = rows.filter((r) => isNewArrival(r.arrived_at, days, now))
  return toProducts(current.length >= NEW_ARRIVALS_RAIL_SIZE ? current : rows.slice(0, NEW_ARRIVALS_RAIL_SIZE))
}

/** Products that have an active sale price, deepest discount first. */
export async function getProductsOnOffer(limit?: number): Promise<ProductWithPricing[]> {
  const products = await toProducts(await repositories.products.getProductsOnOffer(limit))
  return products.map(withPricing)
}

/**
 * Related products for a detail page. Prefers the hand-curated
 * `product_related` rows, then fills any gap with other products from the same
 * category, so the "You may also like" rail is never empty.
 */
export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  return toProducts(await repositories.products.getRelatedProducts(slug, limit))
}

/** Every product slug — used by `generateStaticParams` for SSG. */
export async function getAllProductSlugs(): Promise<string[]> {
  return repositories.products.getAllProductSlugs()
}

/** Products saved to a device's wishlist, most recently added first. */
export async function getWishlistProducts(deviceId: string): Promise<Product[]> {
  return toProducts(await repositories.wishlist.getWishlistProductRows(deviceId))
}
