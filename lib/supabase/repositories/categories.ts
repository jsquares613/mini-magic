import { getSupabaseClient } from '../client'
import type { Tables } from '../database.types'
import { ok, isLive } from './_util'

/** Categories repository. Mirrors the current in-memory `lib/categories.ts`. */

export type CategoryRow = Tables<'categories'>
export type CategoryPromotion = Tables<'category_promotions'>
export type SubcategoryRow = Tables<'subcategories'>

export async function getAllCategories(): Promise<CategoryRow[]> {
  const sb = getSupabaseClient()
  return ok(await sb.from('categories').select('*').order('display_order', { ascending: true }))
}

export async function getFeaturedCategories(limit?: number): Promise<CategoryRow[]> {
  const sb = getSupabaseClient()
  let q = sb.from('categories').select('*').eq('featured', true).order('display_order', { ascending: true })
  if (limit) q = q.limit(limit)
  return ok(await q)
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const sb = getSupabaseClient()
  return ok(await sb.from('categories').select('*').eq('slug', slug).maybeSingle())
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const sb = getSupabaseClient()
  const rows = ok(await sb.from('categories').select('slug'))
  return rows.map((r) => r.slug)
}

export async function getAllSubcategories(): Promise<SubcategoryRow[]> {
  const sb = getSupabaseClient()
  return ok(await sb.from('subcategories').select('*').order('display_order', { ascending: true }))
}

export async function getSubcategoriesByCategoryId(categoryId: string): Promise<SubcategoryRow[]> {
  const sb = getSupabaseClient()
  return ok(await sb.from('subcategories').select('*').eq('category_id', categoryId).order('display_order', { ascending: true }))
}

/** Active, in-schedule promotions (banners) for a category — or all categories. */
export async function getCategoryPromotions(categoryId?: string): Promise<CategoryPromotion[]> {
  const sb = getSupabaseClient()
  let q = sb.from('category_promotions').select('*').eq('active', true).order('display_order', { ascending: true })
  if (categoryId) q = q.eq('category_id', categoryId)
  const rows = ok(await q)
  return rows.filter((r) => isLive(r.starts_at, r.ends_at))
}
