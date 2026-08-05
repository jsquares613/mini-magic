import { cache } from 'react'
import { repositories } from '@/lib/supabase'
import type { Category, Subcategory } from '@/types'
import type { CategoryRow, SubcategoryRow } from '@/lib/supabase/repositories/categories'

/**
 * Category data-access layer — now backed by Supabase (Phase 3 integration).
 *
 * `getCachedCategories` is wrapped in React's `cache()` so that within a single
 * request/render pass, the many components that need a category lookup (every
 * `ProductCard`, the footer, category pages, …) share ONE Supabase round trip
 * instead of issuing one query per component (the classic N+1 problem).
 */

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    image: row.image ?? undefined,
    banner: row.banner_image ?? undefined,
    emoji: row.emoji ?? '🎁',
    color: row.color ?? 'bg-gray-50',
    displayOrder: row.display_order,
    isFeatured: row.featured,
    offer: null, // category_promotions are banner-only (v2.1) — see getCategoryPromotions
    seo: row.seo_title ? { metaTitle: row.seo_title, metaDescription: row.seo_description ?? '' } : undefined,
  }
}

/** All categories, fetched once per request and shared across every caller. */
export const getCachedCategories = cache(async (): Promise<Category[]> => {
  const rows = await repositories.categories.getAllCategories()
  return rows.map(toCategory)
})

/** category_id (uuid) → slug, for resolving `Product.category` after a Supabase read. */
export const getCategoryIdToSlugMap = cache(async (): Promise<Map<string, string>> => {
  const rows = await repositories.categories.getAllCategories()
  return new Map(rows.map((r) => [r.id, r.slug]))
})

export async function getAllCategories(): Promise<Category[]> {
  return getCachedCategories()
}

export async function getFeaturedCategories(limit?: number): Promise<Category[]> {
  const all = await getCachedCategories()
  const list = all.filter((c) => c.isFeatured)
  return limit ? list.slice(0, limit) : list
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const all = await getCachedCategories()
  return all.find((c) => c.slug === slug)
}

/** Map a category slug to its display name, falling back to the slug. */
export async function getCategoryName(slug: string): Promise<string> {
  const category = await getCategoryBySlug(slug)
  return category?.name ?? slug
}

/** Every category slug — used by `generateStaticParams` for SSG. */
export async function getAllCategorySlugs(): Promise<string[]> {
  const all = await getCachedCategories()
  return all.map((c) => c.slug)
}

/** subcategory_id (uuid) → slug, used by toProduct() to resolve Product.subcategory. */
export const getSubcategoryIdToSlugMap = cache(async (): Promise<Map<string, string>> => {
  const rows = await repositories.categories.getAllSubcategories()
  return new Map(rows.map((r) => [r.id, r.slug]))
})

function toSubcategory(row: SubcategoryRow): Subcategory {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    emoji: row.emoji ?? '🏷️',
    displayOrder: row.display_order,
  }
}

export async function getSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]> {
  const rows = await repositories.categories.getSubcategoriesByCategoryId(categoryId)
  return rows.map(toSubcategory)
}
