import { unstable_cache } from 'next/cache'
import { toSupabaseTransformUrl } from '@/lib/supabase/imageTransform'

/**
 * Fallback blur placeholder — 1×1 light-grey SVG.
 * Used when LQIP generation fails or is not applicable (SVG sources,
 * non-Supabase URLs, network timeout, or a transform error).
 */
export const GREY_LQIP =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4='

// Supabase's render endpoint rejects quality < 20 with a 400
// ("querystring/quality must be >= 20") — confirmed against the live
// project. 20 is also the lowest value Supabase allows, which is exactly
// what an LQIP wants (blurred beyond recognition anyway).
const LQIP_WIDTH = 20
const LQIP_QUALITY = 20

// Verified against the live project: width=20/quality=20 on a 1.6 MB PNG
// returns ~725 bytes. 8 KB is a generous ceiling — anything above that
// means the render endpoint ignored the params (e.g. unsupported format)
// and returned something closer to full size, which we don't want inlined.
const MAX_INLINE_BYTES = 8_000

// Fail fast rather than blocking the page render on a slow/unreachable
// Supabase endpoint. 2 s is generous for a 20px thumbnail fetch but still
// bounds the worst case for a first-ever request after deployment.
const FETCH_TIMEOUT_MS = 2_000

/**
 * Uncached fetch — does the actual network call. Throws on any failure
 * (network error, timeout, non-2xx, or oversized response) so the cached
 * wrapper below never permanently stores a failure as if it were success.
 */
async function fetchLqip(imageUrl: string): Promise<string> {
  const tinyUrl = toSupabaseTransformUrl(imageUrl, { width: LQIP_WIDTH, quality: LQIP_QUALITY })
  const res = await fetch(tinyUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`LQIP fetch failed: ${res.status}`)

  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.byteLength > MAX_INLINE_BYTES) {
    throw new Error(`LQIP response too large: ${buf.byteLength} bytes`)
  }

  const type = res.headers.get('content-type') ?? 'image/jpeg'
  return `data:${type};base64,${buf.toString('base64')}`
}

/**
 * Cached wrapper — only ever called for URLs that are eligible for LQIP
 * generation (guarded in `getLqip`), and only ever caches a *successful*
 * result. `unstable_cache` does not persist a rejected promise, so a
 * timeout or transient error here is retried on the next call instead of
 * being pinned as "grey forever" for the lifetime of the build.
 */
const fetchLqipCached = unstable_cache(fetchLqip, ['lqip-v1'], { revalidate: false })

/**
 * Returns a real blurred-thumbnail data URI for `imageUrl`, suitable for
 * `blurDataURL` in next/image. Falls back to a generic grey placeholder for
 * non-Supabase/SVG sources or on any fetch failure — callers never need to
 * handle rejection.
 *
 * Cost model: the first call for a given URL pays one Supabase round trip
 * (capped at 2 s); every subsequent call for that same URL across the
 * server's lifetime is served from the Next.js file-system cache in
 * microseconds. Admin-uploaded URLs are timestamped, so replacing an image
 * naturally invalidates the old cache entry instead of reusing stale art.
 */
export async function getLqip(imageUrl: string): Promise<string> {
  if (!imageUrl || imageUrl.endsWith('.svg') || !imageUrl.includes('.supabase.co')) {
    return GREY_LQIP
  }
  try {
    return await fetchLqipCached(imageUrl)
  } catch {
    return GREY_LQIP
  }
}
