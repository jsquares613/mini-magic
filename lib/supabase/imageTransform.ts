/**
 * Supabase Storage image-transformation utilities.
 *
 * Supabase exposes a `/storage/v1/render/image/public/` endpoint that:
 *   • Resizes the image to the requested width on-the-fly
 *   • Automatically transcodes to WebP for supporting browsers
 *   • Serves the result from Supabase's global CDN (Cloudflare-backed)
 *     so subsequent requests for the same (url × width × quality) tuple are
 *     served from an edge node, not the storage origin
 *
 * Resizing requires the Supabase Pro plan or above; on the Free plan the
 * endpoint still functions but returns the original image unchanged. Either
 * way the URL is valid — callers do not need a feature flag.
 *
 * Next.js Image Optimizer pipeline (after this change):
 *
 *   Browser → /_next/image?url=<TRANSFORM_URL>&w=828&q=75
 *          → Next.js fetches <TRANSFORM_URL> from Supabase CDN
 *               (2 048 px JPEG instead of the raw 6 000 px original)
 *          → Next.js converts to AVIF / WebP, caches for 1 year
 *          → Browser receives optimally-sized AVIF
 *
 * After the first request per (url × device-width), the 1-year TTL means
 * the Next.js disk cache is hit and the entire chain above is skipped.
 */

/**
 * Maximum pixel width requested from Supabase when using the render endpoint
 * as the *source* for the Next.js image optimizer.
 *
 * 2 048 px covers the widest 2× retina desktop breakpoint in deviceSizes;
 * the Next.js optimizer will resize down to the correct device size from there.
 * Asking for anything larger just wastes bandwidth on the origin-fetch leg.
 */
export const SUPABASE_TRANSFORM_MAX_WIDTH = 2048

/**
 * Converts a Supabase Storage public URL to the CDN-served render endpoint.
 *
 * `opts.width`   — target pixel width (omit to skip resizing)
 * `opts.quality` — JPEG/WebP quality 1–100 (defaults to 80)
 *
 * Non-Supabase URLs (local `/public` paths, external CDNs) are returned
 * unchanged so this function is safe to call unconditionally.
 */
export function toSupabaseTransformUrl(
  url: string,
  { width, quality = 80 }: { width?: number; quality?: number } = {},
): string {
  if (!url || !url.includes('/storage/v1/object/public/')) return url

  const renderUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/',
  )

  const params = new URLSearchParams()
  if (width) params.set('width', String(width))
  // Supabase's render endpoint rejects quality < 20 with a 400
  // ("querystring/quality must be >= 20") — confirmed against the live
  // project. Clamp defensively so a caller passing a low value (e.g. for
  // an aggressive LQIP) never produces a broken image request.
  params.set('quality', String(Math.max(20, quality)))
  params.set('resize', 'contain')

  return `${renderUrl}?${params}`
}

/** Reference viewport used to convert a `vw` unit in a `sizes` string to pixels. */
const REFERENCE_VIEWPORT_PX = 1920

/** Assumed device pixel ratio — covers standard retina displays. */
const RETINA_MULTIPLIER = 2

const MIN_TRANSFORM_WIDTH = 320

/**
 * Picks a sensible width to request from the Supabase render endpoint,
 * based on the `sizes` attribute the caller passes to next/image.
 *
 * Without this, every image — including small 56px category icons and
 * 25vw product thumbnails — requested the same fixed 2048px source from
 * Supabase, wasting the origin-fetch bandwidth savings the CDN transform
 * is supposed to provide. A component whose largest rendered size is
 * ~250px has no business pulling a 2048px source through the pipeline.
 *
 * Parses every `<n>px` and `<n>vw` token out of `sizes`, converts `vw` to
 * pixels against a 1920px reference viewport, takes the largest value,
 * and doubles it for retina displays — then clamps to
 * [MIN_TRANSFORM_WIDTH, SUPABASE_TRANSFORM_MAX_WIDTH].
 *
 * The `(max-width: 768px)` media-query conditions that precede each slot
 * are stripped first — they describe a *viewport* breakpoint, not a
 * rendered image width, and matching them directly (e.g. picking up the
 * "1024" in "(max-width: 1024px) 33vw") would inflate the result well
 * past what the image is ever actually displayed at.
 *
 * Falls back to the max width when `sizes` is missing or unparseable, so
 * behavior is never worse than requesting the full source.
 */
export function resolveTransformWidth(sizes?: string): number {
  if (!sizes) return SUPABASE_TRANSFORM_MAX_WIDTH

  const withoutMediaConditions = sizes.replace(/\([^)]*\)/g, '')
  const matches = [...withoutMediaConditions.matchAll(/(\d+(?:\.\d+)?)(px|vw)/g)]
  if (matches.length === 0) return SUPABASE_TRANSFORM_MAX_WIDTH

  const pxValues = matches.map(([, num, unit]) =>
    unit === 'px' ? Number(num) : (Number(num) / 100) * REFERENCE_VIEWPORT_PX,
  )
  const largest = Math.max(...pxValues) * RETINA_MULTIPLIER

  return Math.min(SUPABASE_TRANSFORM_MAX_WIDTH, Math.max(MIN_TRANSFORM_WIDTH, Math.round(largest)))
}
