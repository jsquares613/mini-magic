import { getSupabaseClient } from '../client'
import type { Tables } from '../database.types'
import type { ProductRow } from './products'
import { ok } from './_util'

/**
 * Wishlist repository — anonymous, device-scoped (no customer auth exists on
 * the storefront). Every function is scoped by `deviceId`, an opaque
 * client-generated uuid persisted in a cookie (see app/api/wishlist/route.ts).
 */

export type WishlistItem = Tables<'wishlist_items'>

export async function getWishlistProductIds(deviceId: string): Promise<string[]> {
  const sb = getSupabaseClient()
  const rows = ok(await sb.from('wishlist_items').select('product_id').eq('device_id', deviceId))
  return rows.map((r) => r.product_id)
}

/** Wishlisted products, most recently added first — for the /wishlist page. */
export async function getWishlistProductRows(deviceId: string): Promise<ProductRow[]> {
  const sb = getSupabaseClient()
  const items = ok(
    await sb
      .from('wishlist_items')
      .select('product_id, created_at')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false }),
  )
  if (items.length === 0) return []

  const rows = ok(await sb.from('products').select('*').in('id', items.map((i) => i.product_id)))
  const byId = new Map(rows.map((r) => [r.id, r]))
  return items.map((i) => byId.get(i.product_id)).filter((r): r is ProductRow => Boolean(r))
}

export async function addToWishlist(deviceId: string, productId: string): Promise<void> {
  const sb = getSupabaseClient()
  const { error } = await sb
    .from('wishlist_items')
    .upsert({ device_id: deviceId, product_id: productId }, { onConflict: 'device_id,product_id' })
  if (error) throw new Error(`[supabase] ${error.message}`)
}

export async function removeFromWishlist(deviceId: string, productId: string): Promise<void> {
  const sb = getSupabaseClient()
  const { error } = await sb.from('wishlist_items').delete().eq('device_id', deviceId).eq('product_id', productId)
  if (error) throw new Error(`[supabase] ${error.message}`)
}
