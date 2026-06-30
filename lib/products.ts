import { repositories } from '@/lib/supabase'
import { getCategoryIdToSlugMap } from '@/lib/categories'
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

function toProduct(row: ProductRow, categorySlug: string, images: string[] = []): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    shortDescription: row.short_description ?? '',
    price: row.price ?? 0,
    salePrice: row.sale_price,
    category: categorySlug,
    images,
    ageGroup: '',
    material: row.material ?? '',
    color: row.color ?? '',
    stockStatus: row.available ? 'in-stock' : 'out-of-stock',
    isFeatured: false,
    isPopular: row.popular,
    isNew: row.new_arrival,
    tags: row.tags,
    features: row.features,
    relatedProducts: [],
    displayOrder: row.display_order,
    seo: row.seo_title ? { metaTitle: row.seo_title, metaDescription: row.seo_description ?? '' } : undefined,
  }
}

async function toProducts(rows: ProductRow[]): Promise<Product[]> {
  const [idToSlug, imagesByProduct] = await Promise.all([
    getCategoryIdToSlugMap(),
    repositories.products.getImagesByProductIds(rows.map((r) => r.id)),
  ])
  return rows.map((row) =>
    toProduct(
      row,
      idToSlug.get(row.category_id) ?? row.category_id,
      (imagesByProduct.get(row.id) ?? []).map((i) => i.image_url),
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
  const detail = await repositories.products.getProductBySlug(slug)
  if (!detail) return undefined
  return {
    ...toProduct(
      detail,
      detail.category?.slug ?? detail.category_id,
      detail.images.map((i) => i.image_url),
    ),
    ageGroup: detail.ageGroups.map((a) => a.label).join(', '),
  }
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const rows = await repositories.products.getProductsByCategory(categorySlug)
  const imagesByProduct = await repositories.products.getImagesByProductIds(rows.map((r) => r.id))
  return rows.map((row) => toProduct(row, categorySlug, (imagesByProduct.get(row.id) ?? []).map((i) => i.image_url)))
}

export async function getFeaturedProducts(limit?: number): Promise<Product[]> {
  return toProducts(await repositories.homepage.getFeaturedProducts(limit))
}

export async function getPopularProducts(limit?: number): Promise<Product[]> {
  return toProducts(await repositories.products.getPopularProducts(limit))
}

export async function getNewProducts(limit?: number): Promise<Product[]> {
  return toProducts(await repositories.products.getNewProducts(limit))
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
