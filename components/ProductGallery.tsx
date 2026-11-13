'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import SafeImage from '@/components/SafeImage'
import EnquiryButton from '@/components/EnquiryButton'
import { isLightSwatch, swatchOf } from '@/lib/productColors'
import type { GalleryImage, ProductColorOption } from '@/types'

/**
 * Product detail gallery + colour picker. They sit in different columns of
 * the page, so the picked colour lives in a small context around both.
 *
 * Picking a colour shows that colour's photos first, followed by the general
 * photos (the ones not tied to a colour). A colour without its own photos
 * just shows the general ones.
 */

const AUTOPLAY_MS = 3500
/** After a manual swipe/click, wait this long before sliding again. */
const RESUME_AFTER_MS = 8000
const SWIPE_PX = 40

interface ColorState {
  colors: ProductColorOption[]
  gallery: GalleryImage[]
  selectedId: string | null
  select: (id: string | null) => void
}

const ColorCtx = createContext<ColorState>({ colors: [], gallery: [], selectedId: null, select: () => {} })

export function ProductColorProvider({
  colors,
  gallery,
  children,
}: {
  colors: ProductColorOption[]
  gallery: GalleryImage[]
  children: ReactNode
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const value = useMemo(() => ({ colors, gallery, selectedId, select: setSelectedId }), [colors, gallery, selectedId])
  return <ColorCtx.Provider value={value}>{children}</ColorCtx.Provider>
}

function visibleImages(gallery: GalleryImage[], selectedId: string | null): GalleryImage[] {
  if (!selectedId) return gallery
  const own = gallery.filter((g) => g.colorId === selectedId)
  const general = gallery.filter((g) => g.colorId === null)
  const shown = [...own, ...general]
  return shown.length ? shown : gallery
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

export function ProductGallery({
  name,
  overlay,
  className = '',
}: {
  name: string
  /** Badges drawn over the photo (promo tag, discount). */
  overlay?: ReactNode
  className?: string
}) {
  const { gallery, selectedId, colors } = useContext(ColorCtx)
  const images = useMemo(() => visibleImages(gallery, selectedId), [gallery, selectedId])
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [pausedUntil, setPausedUntil] = useState(0)
  const reducedMotion = usePrefersReducedMotion()
  const touchX = useRef<number | null>(null)
  const count = images.length

  // New colour → start from its first photo.
  useEffect(() => setIndex(0), [selectedId])

  const goTo = useCallback(
    (next: number, manual = true) => {
      if (count === 0) return
      setIndex(((next % count) + count) % count)
      if (manual) setPausedUntil(Date.now() + RESUME_AFTER_MS)
    },
    [count],
  )

  // Auto-slide, paused while hovered, after a manual change, in a hidden tab, or with reduced motion.
  useEffect(() => {
    if (count < 2 || hovered || reducedMotion) return
    const delay = Math.max(AUTOPLAY_MS, pausedUntil - Date.now())
    const t = window.setTimeout(() => {
      if (document.visibilityState === 'visible') setIndex((i) => (i + 1) % count)
      else setPausedUntil(Date.now()) // re-arm the timer
    }, delay)
    return () => window.clearTimeout(t)
  }, [count, hovered, reducedMotion, pausedUntil, index])

  const colorName = colors.find((c) => c.id === selectedId)?.name
  const alt = (i: number) => `${name}${colorName ? ` in ${colorName}` : ''} - photo ${i + 1} of ${count}`

  return (
    <div className={className}>
      <div
        className="relative aspect-square overflow-hidden rounded-3xl bg-white"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (Math.abs(dx) > SWIPE_PX) goTo(index + (dx < 0 ? 1 : -1))
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} photos`}
      >
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              className="relative h-full w-full shrink-0"
              aria-hidden={i !== index}
              role="group"
              aria-roledescription="slide"
            >
              <SafeImage
                src={img.url}
                alt={alt(i)}
                priority={i === 0}
                eager={i !== 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {overlay}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-gray-800 shadow-md backdrop-blur transition hover:bg-white"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-gray-800 shadow-md backdrop-blur transition hover:bg-white"
              aria-label="Next photo"
            >
              ›
            </button>
            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full shadow transition-all ${i === index ? 'w-6 bg-blue-900' : 'w-2 bg-white/90 hover:bg-white'}`}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === index}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={`${img.url}-thumb-${i}`}
              type="button"
              onClick={() => goTo(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition md:h-20 md:w-20 ${
                i === index ? 'border-blue-900' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              aria-label={`Show photo ${i + 1}`}
            >
              <SafeImage src={img.url} alt="" sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Colour pills. Picking one switches the gallery to that colour's photos. */
export function ProductColorPicker({ className = '' }: { className?: string }) {
  const { colors, gallery, selectedId, select } = useContext(ColorCtx)
  if (colors.length === 0) return null
  const selected = colors.find((c) => c.id === selectedId)

  return (
    <div className={className}>
      <p className="mb-2 text-sm text-gray-600">
        <span className="font-semibold text-gray-900">Colour:</span>{' '}
        {selected ? selected.name : colors.length === 1 ? colors[0].name : `${colors.length} colours available`}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a colour">
        {colors.map((c) => {
          const active = c.id === selectedId
          const swatch = swatchOf(c)
          const hasPhotos = gallery.some((g) => g.colorId === c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => select(active ? null : c.id)}
              aria-pressed={active}
              title={hasPhotos ? `See ${c.name}` : c.name}
              className={`inline-flex items-center gap-2 rounded-full border-2 bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold transition ${
                active ? 'border-blue-900 text-blue-900 shadow-sm' : 'border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              {swatch && (
                <span
                  className={`h-6 w-6 rounded-full ${isLightSwatch(swatch) ? 'ring-1 ring-inset ring-gray-300' : ''}`}
                  style={{ backgroundColor: swatch }}
                  aria-hidden="true"
                />
              )}
              <span className={swatch ? '' : 'pl-2.5'}>{c.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** The enquiry button, mentioning the picked colour. */
export function ProductEnquiryButton({ name, productSlug }: { name: string; productSlug: string }) {
  const { colors, selectedId } = useContext(ColorCtx)
  const colorName = colors.find((c) => c.id === selectedId)?.name
  return <EnquiryButton subject={colorName ? `${name} (Colour: ${colorName})` : name} source="product" productSlug={productSlug} />
}
