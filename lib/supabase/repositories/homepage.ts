import { getSupabaseClient } from '../client'
import type { Tables } from '../database.types'
import { ok, isLive } from './_util'
import type { ProductRow } from './products'

/** Homepage content repository: hero, sections, curated featured, banners. */

export type HeroSlide = Tables<'homepage_hero_slides'>
export type PromotionalBanner = Tables<'promotional_banners'>

/** Active hero slides that are currently within their schedule window. */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const sb = getSupabaseClient()
  const rows = ok(
    await sb.from('homepage_hero_slides').select('*').eq('active', true).order('display_order', { ascending: true }),
  )
  return rows.filter((r) => isLive(r.starts_at, r.ends_at))
}

/** Manually-curated featured products, in admin-defined order (v2 model). */
export async function getFeaturedProducts(limit?: number): Promise<ProductRow[]> {
  const sb = getSupabaseClient()
  const pivots = ok(
    await sb.from('homepage_featured_products').select('product_id, sort_order').order('sort_order', { ascending: true }),
  )
  const ids = pivots.map((p) => p.product_id)
  if (ids.length === 0) return []

  const products = ok(await sb.from('products').select('*').in('id', ids))
  const ordered = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is ProductRow => Boolean(p))
  return limit ? ordered.slice(0, limit) : ordered
}

/** Active, in-schedule promotional banners. */
export async function getPromotionalBanners(): Promise<PromotionalBanner[]> {
  const sb = getSupabaseClient()
  const rows = ok(
    await sb.from('promotional_banners').select('*').eq('active', true).order('display_order', { ascending: true }),
  )
  return rows.filter((r) => isLive(r.starts_at, r.ends_at))
}
