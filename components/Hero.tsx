'use client'

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { isVideo } from '@/lib/media'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A single span of styled text. `className` overrides the default colour and
 * `break` renders a line break after the segment. Modelling the headline and
 * description this way keeps the per-slide copy in data (lib/hero.ts) while the
 * component stays presentational and fully reusable across pages.
 */
export type RichTextSegment = {
  text: string
  className?: string
  break?: boolean
}

export type HeroHighlight = {
  icon: string
  label: string
}

export type HeroSlide = {
  id: string | number
  image: string
  imageAlt: string
  badge?: string
  title: RichTextSegment[]
  description: RichTextSegment[]
  ctaLabel?: string
  ctaHref?: string
  highlights?: HeroHighlight[]
  /** Real per-image LQIP generated server-side — passed as blurDataURL to SafeImage. */
  blurDataURL?: string
}

type HeroProps = {
  slides: HeroSlide[]
  /** Autoplay delay in ms. Pass 0 to disable autoplay. */
  autoPlayInterval?: number
  /** Optional extra classes for the outer <section>. */
  className?: string
}

function RichText({ segments }: { segments: RichTextSegment[] }) {
  return (
    <>
      {segments.map((seg, i) => (
        <span key={i}>
          <span className={seg.className}>{seg.text}</span>
          {seg.break && <br />}
        </span>
      ))}
    </>
  )
}

export default function Hero({ slides, autoPlayInterval = 5000, className = '' }: HeroProps) {
  const count = slides.length
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)

  const goTo = useCallback((i: number) => setCurrent(((i % count) + count) % count), [count])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count])
  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count])

  const SWIPE_THRESHOLD = 40 // px — minimum horizontal drag before it counts as a swipe

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
    setIsPaused(true)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }, [])

  const onTouchEnd = useCallback(() => {
    if (touchDeltaX.current > SWIPE_THRESHOLD) prev()
    else if (touchDeltaX.current < -SWIPE_THRESHOLD) next()
    touchStartX.current = null
    touchDeltaX.current = 0
    setIsPaused(false)
  }, [prev, next])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (!isPaused && autoPlayInterval > 0 && count > 1) {
      intervalRef.current = window.setInterval(() => {
        setCurrent((prev) => (prev + 1) % count)
      }, autoPlayInterval)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPaused, autoPlayInterval, count])

  if (count === 0) return null

  return (
    <section className={`py-4 px-4 md:py-8 md:px-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/*
          The slides are stacked in a single CSS grid cell (every slide uses
          `col-start-1 row-start-1`). The grid auto-sizes to the *tallest* slide,
          so the carousel height is identical for every slide and never changes
          when switching — eliminating size differences and layout shift (CLS)
          without any hardcoded pixel heights. Only opacity animates.
        */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative grid touch-pan-y overflow-hidden rounded-2xl bg-primary"
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured highlights"
        >
          {slides.map((slide, index) => {
            const active = index === current
            const highlights = slide.highlights ?? []
            return (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}`}
                aria-hidden={!active}
                className={`col-start-1 row-start-1 relative flex min-h-[190px] flex-col justify-center p-4 md:min-h-[440px] md:p-10 transition-opacity duration-700 ease-in-out ${
                  active ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                {/* Artwork — full-bleed background behind the text, on both mobile and desktop. */}
                <div className="absolute inset-0">
                  {isVideo(slide.image) ? (
                    <video
                      src={slide.image}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <SafeImage
                      src={slide.image}
                      alt={slide.imageAlt}
                      priority={index === 0}
                      eager={index > 0 && index < 3}
                      blurDataURL={slide.blurDataURL}
                      sizes="(max-width: 768px) 100vw, 1280px"
                      className="object-cover object-center"
                    />
                  )}
                </div>


                {/* Text column */}
                <div className="relative z-10 flex w-[30%] flex-col justify-center md:w-1/2">
                  {slide.badge && (
                    <p className="mb-1 text-[7px] font-bold uppercase tracking-wide text-blue-900/80 md:mb-6 md:text-sm">
                      {slide.badge}
                    </p>
                  )}

                  <h1 className="mb-1 text-xs font-extrabold leading-tight md:mb-4 md:text-5xl">
                    <RichText segments={slide.title} />
                  </h1>

                  <p className="mb-2 max-w-md text-[8px] text-gray-700 md:mb-6 md:text-base">
                    <RichText segments={slide.description} />
                  </p>

                  <div className="flex flex-wrap items-start gap-1 md:gap-6">
                    {slide.ctaLabel &&
                      (slide.ctaHref ? (
                        <Link
                          href={slide.ctaHref}
                          className="inline-flex transform items-center gap-1 rounded-full bg-blue-900 px-2 py-1 text-[8px] font-bold text-white transition hover:scale-105 hover:bg-blue-800 md:px-6 md:py-3 md:text-base"
                        >
                          {slide.ctaLabel}
                          <span aria-hidden="true">→</span>
                        </Link>
                      ) : (
                        <button className="inline-flex transform items-center gap-1 rounded-full bg-blue-900 px-2 py-1 text-[8px] font-bold text-white transition hover:scale-105 hover:bg-blue-800 md:px-6 md:py-3 md:text-base">
                          {slide.ctaLabel}
                          <span aria-hidden="true">→</span>
                        </button>
                      ))}

                    {highlights.length > 0 && (
                      <div className="flex flex-col gap-1 md:gap-3">
                        {highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-1 md:gap-2">
                            <span className="text-xs md:text-2xl">{h.icon}</span>
                            <span className="text-[8px] font-medium text-gray-700 md:text-sm">{h.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {count > 1 && (
            <>
              {/* Prev / next controls */}
              <button
                onClick={prev}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-blue-900 shadow transition hover:bg-white md:flex"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={next}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-blue-900 shadow transition hover:bg-white md:flex"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dots (desktop) — overlaid on the image, matching the original full-bleed treatment */}
              <div className="absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 gap-2 md:flex">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goTo(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    aria-current={current === idx}
                    className={`h-3 w-3 rounded-full transition-opacity duration-300 ${
                      current === idx ? 'bg-yellow-500' : 'border bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Dots (mobile) — sit below the card on the page background, matching the reference */}
        {count > 1 && (
          <div className="mt-3 flex justify-center gap-1.5 md:hidden">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={current === idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  current === idx ? 'w-4 bg-blue-900' : 'w-1.5 bg-blue-900/25'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
