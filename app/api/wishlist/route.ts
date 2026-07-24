import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseClient } from '@/lib/supabase/client'
import { repositories } from '@/lib/supabase'
import { getWishlistProducts } from '@/lib/products'

/**
 * Wishlist endpoint for anonymous shoppers (no customer auth exists). Identity
 * is an opaque `device_id` uuid, stored in a first-party httpOnly cookie and
 * created on first use — mirrors the productSlug→product_id resolution already
 * used by app/api/enquiries/route.ts.
 */

const DEVICE_COOKIE = 'device_id'
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function getOrCreateDeviceId(): string {
  const store = cookies()
  const existing = store.get(DEVICE_COOKIE)?.value
  if (existing) return existing
  const id = crypto.randomUUID()
  store.set(DEVICE_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: DEVICE_COOKIE_MAX_AGE })
  return id
}

async function resolveProductId(slug: string): Promise<string | null> {
  const sb = getSupabaseClient()
  const { data } = await sb.from('products').select('id').eq('slug', slug).maybeSingle()
  return data?.id ?? null
}

/** `?full=1` returns hydrated products (for /wishlist); otherwise just ids (for heart-state hydration). */
export async function GET(request: Request) {
  const deviceId = getOrCreateDeviceId()
  const { searchParams } = new URL(request.url)

  if (searchParams.get('full') === '1') {
    const products = await getWishlistProducts(deviceId)
    return NextResponse.json({ ok: true, products })
  }

  const productIds = await repositories.wishlist.getWishlistProductIds(deviceId)
  return NextResponse.json({ ok: true, productIds })
}

export async function POST(request: Request) {
  let body: { productSlug?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.productSlug) {
    return NextResponse.json({ ok: false, error: 'Missing productSlug' }, { status: 422 })
  }

  const productId = await resolveProductId(body.productSlug)
  if (!productId) {
    return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 })
  }

  const deviceId = getOrCreateDeviceId()
  await repositories.wishlist.addToWishlist(deviceId, productId)
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: Request) {
  let body: { productSlug?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.productSlug) {
    return NextResponse.json({ ok: false, error: 'Missing productSlug' }, { status: 422 })
  }

  const productId = await resolveProductId(body.productSlug)
  if (!productId) {
    return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 })
  }

  const deviceId = getOrCreateDeviceId()
  await repositories.wishlist.removeFromWishlist(deviceId, productId)
  return NextResponse.json({ ok: true })
}
