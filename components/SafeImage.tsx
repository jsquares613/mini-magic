import Image from 'next/image'

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
 */
export default function SafeImage({
  src,
  alt,
  sizes,
  priority,
  className = '',
}: {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
}) {
  if (src.toLowerCase().endsWith('.svg')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    )
  }

  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={className} />
}
