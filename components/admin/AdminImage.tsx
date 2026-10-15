import { toSupabaseTransformUrl } from '@/lib/supabase/imageTransform'

/**
 * Admin thumbnail/preview image. Asks the Supabase image CDN for a resized
 * copy (1× and 2× for sharp screens) instead of the full-size original —
 * same approach as the storefront's SafeImage — lazy-loaded and decoded off
 * the main thread. SVG, blob: and non-Supabase URLs pass through unchanged.
 *
 * `width` is the rendered CSS width in pixels.
 */
export default function AdminImage({
  src,
  width,
  alt = '',
  className = '',
  eager = false,
}: {
  src: string
  width: number
  alt?: string
  className?: string
  eager?: boolean
}) {
  const resizable = !src.toLowerCase().split('?')[0].endsWith('.svg')
  const x1 = resizable ? toSupabaseTransformUrl(src, { width }) : src
  const x2 = resizable ? toSupabaseTransformUrl(src, { width: width * 2 }) : src
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={x1}
      srcSet={x1 !== src ? `${x1} 1x, ${x2} 2x` : undefined}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  )
}
