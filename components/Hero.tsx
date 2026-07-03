'use client'

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
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

  const goTo = useCallback((i: number) => setCurrent(((i % count) + count) % count), [count])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count])
  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count])

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
    <section className={`bg-[#FFFFEC] py-6 px-4 md:py-8 md:px-6 ${className}`}>
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
          className="relative grid overflow-hidden rounded-2xl bg-[#FFF7D0]"
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
                className={`col-start-1 row-start-1 relative flex items-center min-h-[360px] md:min-h-[440px] transition-opacity duration-700 ease-in-out ${
                  active ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                {/* Decorative banner artwork — object-cover keeps the aspect ratio
                    (never stretches/distorts), it only crops. */}
                <SafeImage
                  src={slide.image}
                  alt={slide.imageAlt}
                  priority={index === 0}
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover object-center"
                />

                {/* Readability scrim so copy stays legible over any crop. */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFF7D0]/90 via-[#FFF7D0]/50 to-transparent md:from-[#FFF7D0]/75 md:via-[#FFF7D0]/10" />

                {/* Content layer */}
                <div className="relative z-10 grid w-full grid-cols-1 items-center gap-6 p-6 md:grid-cols-2 md:p-10">
                  <div>
                    {slide.badge && (
                      <div className="mb-6 inline-block rounded-full bg-blue-100 px-4 py-2 font-semibold text-blue-600">
                        {slide.badge}
                      </div>
                    )}

                    <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">
                      <RichText segments={slide.title} />
                    </h1>

                    <p className="mb-6 max-w-md text-base text-gray-700">
                      <RichText segments={slide.description} />
                    </p>

                    <div className="flex flex-wrap items-start gap-6">
                      {slide.ctaLabel &&
                        (slide.ctaHref ? (
                          <Link
                            href={slide.ctaHref}
                            className="inline-flex transform items-center gap-2 rounded-full bg-yellow-500 px-6 py-3 font-bold text-white transition hover:scale-105 hover:bg-yellow-600"
                          >
                            {slide.ctaLabel}
                          </Link>
                        ) : (
                          <button className="inline-flex transform items-center gap-2 rounded-full bg-yellow-500 px-6 py-3 font-bold text-white transition hover:scale-105 hover:bg-yellow-600">
                            {slide.ctaLabel}
                          </button>
                        ))}

                      {highlights.length > 0 && (
                        <div className="flex flex-col gap-3">
                          {highlights.map((h, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-2xl">{h.icon}</span>
                              <span className="text-sm font-medium text-gray-700">{h.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right column is intentionally empty — the artwork's
                      illustration shows through here on md+ screens. */}
                  <div className="hidden md:block" aria-hidden="true" />
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

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
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
      </div>
    </section>
  )
}
