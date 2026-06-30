import { getSupabaseClient } from '../client'
import type { Tables } from '../database.types'
import { ok } from './_util'

/**
 * Products repository — all product reads go through here. Mirrors the read API
 * of the current in-memory `lib/products.ts` so Phase 3 integration is a swap,
 * not a rewrite. Uses separate queries + JS composition (rather than PostgREST
 * embeds) so it stays fully typed against the hand-authored Database types.
 */

export type ProductRow = Tables<'products'>
export type ProductImage = Tables<'product_images'>
export type AgeGroup = Tables<'age_groups'>
export type Category = Tables<'categories'>

/** A product with the relations a detail page needs. */
export interface ProductDetail extends ProductRow {
  images: ProductImage[]
  ageGroups: AgeGroup[]
  category: Category | null
}

const ORDER = { column: 'display_order', ascending: true } as const

export async function getAllProducts(): Promise<ProductRow[]> {
  const sb = getSupabaseClient()
  return ok(await sb.from('products').select('*').order(ORDER.column, { ascending: true }))
}

export async function getAllProductSlugs(): Promise<string[]> {
  const sb = getSupabaseClient()
  const rows = ok(await sb.from('products').select('slug'))
  return rows.map((r) => r.slug)
}

/**
 * All images for a set of products in ONE query (not N), grouped by
 * product_id, each list ordered primary-first then by sort_order — exactly
 * what every list-view (cards, rails, related products) needs to render an
 * image without a per-product round trip.
 */
export async function getImagesByProductIds(productIds: string[]): Promise<Map<string, ProductImage[]>> {
  const map = new Map<string, ProductImage[]>()
  if (productIds.length === 0) return map
  const sb = getSupabaseClient()
  const rows = ok(
    await sb
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .order('is_primary', { ascending: false })
      .order('sort_order', { ascending: true }),
  )
  for (const row of rows) {
    const list = map.get(row.product_id) ?? []
    list.push(row)
    map.set(row.product_id, list)
  }
  return map
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const sb = getSupabaseClient()
  const product = ok(await sb.from('products').select('*').eq('slug', slug).maybeSingle())
  if (!product) return null

  const images = ok(
    await sb.from('product_images').select('*').eq('product_id', product.id).order('sort_order', { ascending: true }),
  )
  const pivots = ok(await sb.from('product_age_groups').select('age_group_id').eq('product_id', product.id))
  const category = ok(await sb.from('categories').select('*').eq('id', product.category_id).maybeSingle())

  const ageGroupIds = pivots.map((p) => p.age_group_id)
  const ageGroups = ageGroupIds.length
    ? ok(await sb.from('age_groups').select('*').in('id', ageGroupIds).order('sort_order', { ascending: true }))
    : []

  return { ...product, images, ageGroups, category }
}

export async function getProductsByCategory(categorySlug: string): Promise<ProductRow[]> {
  const sb = getSupabaseClient()
  const category = ok(await sb.from('categories').select('id').eq('slug', categorySlug).maybeSingle())
  if (!category) return []
  return ok(
    await sb.from('products').select('*').eq('category_id', category.id).order('display_order', { ascending: true }),
  )
}

export async function getProductsByAgeGroup(ageSlug: string): Promise<ProductRow[]> {
  const sb = getSupabaseClient()
  const age = ok(await sb.from('age_groups').select('id').eq('slug', ageSlug).maybeSingle())
  if (!age) return []
  const pivots = ok(await sb.from('product_age_groups').select('product_id').eq('age_group_id', age.id))
  const ids = pivots.map((p) => p.product_id)
  if (ids.length === 0) return []
  return ok(await sb.from('products').select('*').in('id', ids).order('display_order', { ascending: true }))
}

export async function getPopularProducts(limit?: number): Promise<ProductRow[]> {
  const sb = getSupabaseClient()
  let q = sb.from('products').select('*').eq('popular', true).order('display_order', { ascending: true })
  if (limit) q = q.limit(limit)
  return ok(await q)
}

export async function getNewProducts(limit?: number): Promise<ProductRow[]> {
  const sb = getSupabaseClient()
  let q = sb.from('products').select('*').eq('new_arrival', true).order('display_order', { ascending: true })
  if (limit) q = q.limit(limit)
  return ok(await q)
}

/** Products with an active sale price. Sorted by deepest discount (computed in JS). */
export async function getProductsOnOffer(limit?: number): Promise<ProductRow[]> {
  const sb = getSupabaseClient()
  const rows = ok(await sb.from('products').select('*').not('sale_price', 'is', null))
  const discount = (p: ProductRow) =>
    p.price && p.sale_price ? (p.price - p.sale_price) / p.price : 0
  const sorted = rows.sort((a, b) => discount(b) - discount(a))
  return limit ? sorted.slice(0, limit) : sorted
}

/**
 * Related products for a detail page: curated `product_related` first, then
 * filled from the same category so the rail is never empty.
 */
export async function getRelatedProducts(slug: string, limit = 4): Promise<ProductRow[]> {
  const sb = getSupabaseClient()
  const product = ok(await sb.from('products').select('id, category_id').eq('slug', slug).maybeSingle())
  if (!product) return []

  const curatedPivots = ok(
    await sb.from('product_related').select('related_product_id, sort_order').eq('product_id', product.id).order('sort_order', { ascending: true }),
  )
  const curatedIds = curatedPivots.map((r) => r.related_product_id)

  let related: ProductRow[] = []
  if (curatedIds.length) {
    const curated = ok(await sb.from('products').select('*').in('id', curatedIds))
    // preserve curated order
    related = curatedIds
      .map((id) => curated.find((p) => p.id === id))
      .filter((p): p is ProductRow => Boolean(p))
  }

  if (related.length < limit) {
    const excludeIds = [product.id, ...related.map((p) => p.id)]
    const fillers = ok(
      await sb
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('display_order', { ascending: true })
        .limit(limit - related.length),
    )
    related = [...related, ...fillers]
  }

  return related.slice(0, limit)
}
