import type { Product } from '@/types'

/**
 * Homepage product rails that keep loading as you scroll sideways
 * (components/InfiniteProductRail.tsx ↔ app/api/rails/[rail]/route.ts).
 */
export const RAILS = ['new-arrivals', 'offers', 'all-products'] as const
export type RailKind = (typeof RAILS)[number]

/** Products per page — the first page is rendered with the homepage, the rest fetched. */
export const RAIL_PAGE_SIZE = 12
/** Deepest offset the API serves (stops pathological requests). */
export const RAIL_MAX_OFFSET = 5000

export interface RailPage {
  products: Product[]
  hasMore: boolean
}

export function isRailKind(value: string): value is RailKind {
  return (RAILS as readonly string[]).includes(value)
}

/**
 * Shuffle seed for the "All Products" rail: today's date in shop time
 * ("2026-10-22"), so the order changes every day at midnight IST. Pages fetched
 * later carry the seed they started with, so a visitor never sees repeats.
 */
export function dailyShuffleSeed(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export function isShuffleSeed(value: string | null): value is string {
  return value != null && /^\d{4}-\d{2}-\d{2}$/.test(value)
}
