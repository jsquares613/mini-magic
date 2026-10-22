import { NextResponse, type NextRequest } from 'next/server'
import { getNewArrivalsPage, getOffersPage, getShuffledPage } from '@/lib/products'
import { RAIL_MAX_OFFSET, dailyShuffleSeed, isRailKind, isShuffleSeed, type RailKind, type RailPage } from '@/lib/rails'

const LOADERS: Record<RailKind, (offset: number, params: URLSearchParams) => Promise<RailPage>> = {
  'new-arrivals': (offset) => getNewArrivalsPage(offset),
  offers: (offset) => getOffersPage(offset),
  // Keep the order the visitor started with (seed from the first page); default to today's.
  'all-products': (offset, params) => {
    const seed = params.get('seed')
    return getShuffledPage(isShuffleSeed(seed) ? seed : dailyShuffleSeed(), offset)
  },
}

/**
 * The next page of a homepage product rail, for InfiniteProductRail.
 * GET /api/rails/new-arrivals?offset=12 → { products, hasMore }.
 * The page size is fixed here, so a client can't ask for the whole catalogue.
 */
export async function GET(request: NextRequest, { params }: { params: { rail: string } }) {
  if (!isRailKind(params.rail)) return NextResponse.json({ error: 'Unknown rail' }, { status: 404 })

  const search = request.nextUrl.searchParams
  const offset = Number(search.get('offset') ?? 0)
  if (!Number.isInteger(offset) || offset < 0 || offset > RAIL_MAX_OFFSET) {
    return NextResponse.json({ error: 'Invalid offset' }, { status: 400 })
  }

  try {
    const page = await LOADERS[params.rail](offset, search)
    // Public catalogue data: let browsers/CDNs reuse a page for a minute, like the ISR homepage.
    return NextResponse.json(page, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300' } })
  } catch {
    return NextResponse.json({ error: 'Could not load products' }, { status: 502 })
  }
}
