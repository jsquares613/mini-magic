import Image from 'next/image'
import { toSupabaseTransformUrl, resolveTransformWidth } from '@/lib/supabase/imageTransform'

/**
 * Drop-in replacement for `next/image` (fill-mode only — the only mode this
 * app uses) that avoids a confirmed Next.js optimizer bug: `next/image`
 * sniffs magic bytes via `detectContentType()` and only recognises SVG if the
 * file starts with the literal `<?xml` prolog. Plenty of valid SVGs (every
 * bundled hero asset in this project, and any admin-uploaded SVG logo/banner
 * — uploads accept `image/*` with no further restriction) start directly
 * with `<svg ...>` instead, which the sniffer fails to detect, so the
 * optimizer 400s with "The requested resource isn't a valid image" and the
 * image never renders.
 *
 * SVGs gain nothing from raster optimization anyway (no resize/recompress
 * benefit for vector graphics), so for `.svg` sources we render a plain
 * `<img>` styled to match `fill` behaviour exactly; everything else still
 * goes through `next/image` for real optimization.
 *
 * ─── Loading strategy ────────────────────────────────────────────────────────
 *   priority={true}  → <link rel="preload" fetchpriority="high"> + eager  (LCP)
 *   eager={true}     → loading="eager", no preload link          (slides 1–2)
 *   (default)        → loading="lazy" via IntersectionObserver   (off-screen)
 *
 * ─── Source optimization ─────────────────────────────────────────────────────
 *   Supabase Storage URLs are rewritten to the render/image endpoint before
 *   being passed to next/image. This means:
 *
 *     Supabase CDN serves a pre-sized JPEG  ← reduced origin-fetch size
 *     Next.js re-encodes to AVIF at the device-appropriate srcset size
 *     Next.js caches result for 1 year
 *
 *   Instead of the old flow where next/image fetched the raw (potentially
 *   6 000 px) original on every cache miss.
 *
 *   The requested width is derived from `sizes` via `resolveTransformWidth`
 *   (see lib/supabase/imageTransform.ts) — a 56px category icon requests a
 *   ~320px source, not the same 2048px cap used for a full-bleed hero.
 *
 * ─── Blur placeholder ────────────────────────────────────────────────────────
 *   All raster images use placeholder="blur". If a real per-image LQIP is
 *   passed via `blurDataURL`, it is used; otherwise the generic grey SVG
 *   below ensures images never pop in from white blank space.
 */

// 1×1 light-grey SVG — generic fallback when no real LQIP is available.
const GREY_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4='

export default function SafeImage({
  src,
  alt,
  sizes,
  priority,
  eager,
  blurDataURL,
  className = '',
}: {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  /** Load eagerly (no lazy-defer) without adding a high-priority preload link. */
  eager?: boolean
  /**
   * Real per-image LQIP generated server-side via `getLqip()`.
   * Falls back to the generic grey placeholder when omitted.
   */
  blurDataURL?: string
  className?: string
}) {
  if (src.toLowerCase().endsWith('.svg')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={priority || eager ? 'eager' : 'lazy'}
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    )
  }

  // Pre-size Supabase images via the CDN transform endpoint, using a width
  // derived from how large this image is actually ever displayed (`sizes`).
  // next/image will still resize further based on the device srcset width,
  // but instead of always fetching a fixed 2048px source, small components
  // (category icons, product thumbnails) now pull a proportionally small
  // source from the Supabase global CDN edge.
  const optimizedSrc = toSupabaseTransformUrl(src, {
    width: resolveTransformWidth(sizes),
    quality: 90,
  })

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      fill
      priority={priority}
      loading={priority ? undefined : eager ? 'eager' : 'lazy'}
      sizes={sizes}
      className={className}
      placeholder="blur"
      blurDataURL={blurDataURL ?? GREY_PLACEHOLDER}
    />
  )
}
