import Image from 'next/image'
import { toSupabaseTransformUrl, resolveTransformWidth } from '@/lib/supabase/imageTransform'

/**
 * Drop-in replacement for `next/image` (fill-mode only) that handles three
 * image categories:
 *
 *   SVG          → plain <img> (next/image bugs on SVGs without <?xml prolog)
 *   Supabase CDN → plain <img> with responsive srcset served directly from
 *                  Supabase's global edge (WebP, no Next.js encoding step —
 *                  this eliminates the cold-cache AVIF encoding latency that
 *                  made images appear slow on first load)
 *   Other        → next/image with full optimization pipeline
 *
 * ─── Loading strategy ────────────────────────────────────────────────────────
 *   priority={true}  → fetchpriority="high" + loading="eager"   (LCP images)
 *   eager={true}     → loading="eager"                          (above-fold)
 *   (default)        → loading="lazy" via IntersectionObserver  (off-screen)
 *
 * ─── Supabase CDN srcset ─────────────────────────────────────────────────────
 *   Supabase's /storage/v1/render/image/ endpoint serves WebP from Cloudflare
 *   edge nodes worldwide. Bypassing the Next.js optimizer means:
 *     • No AVIF encoding step — images start arriving immediately on cold cache
 *     • Supabase CDN cache is shared across all visitors (not per-server disk)
 *     • Responsive srcset at 320/640/960/1280/1920 px, browser picks best fit
 */

const SRCSET_WIDTHS = [320, 640, 960, 1280, 1920]

// 1×1 light-grey SVG — blur placeholder fallback when no real LQIP is available.
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
  /** Load eagerly without adding a high-priority preload link. */
  eager?: boolean
  /** Per-image LQIP. Falls back to grey placeholder when omitted. */
  blurDataURL?: string
  className?: string
}) {
  const loadingAttr = priority || eager ? 'eager' : 'lazy'
  const baseClass = `absolute inset-0 h-full w-full ${className}`

  // SVG: next/image mis-detects SVGs without <?xml prolog → use plain <img>
  if (src.toLowerCase().endsWith('.svg')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} loading={loadingAttr} className={baseClass} />
    )
  }

  // Supabase Storage images: serve directly from Supabase's CDN edge with a
  // responsive srcset. Bypasses the Next.js optimizer so there is no
  // server-side AVIF encoding step on cold cache — WebP arrives instantly
  // from the nearest Cloudflare edge node.
  if (src.includes('/storage/v1/')) {
    const bestSrc = toSupabaseTransformUrl(src, { width: resolveTransformWidth(sizes), quality: 85 })
    const srcSet = SRCSET_WIDTHS
      .map((w) => `${toSupabaseTransformUrl(src, { width: w, quality: 85 })} ${w}w`)
      .join(', ')
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={bestSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={loadingAttr}
        decoding="async"
        className={baseClass}
      />
    )
  }

  // All other images (local /public assets, external CDNs) go through next/image.
  return (
    <Image
      src={src}
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
