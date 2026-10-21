'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A row of product cards that scrolls sideways: swipe on phones, arrow buttons on
 * larger screens (each hidden at its end). Cards snap into place. The cards are
 * server-rendered and passed in as `children`, each in a `role="listitem"` wrapper
 * that sets its width.
 */
export default function ProductRail({ label, children }: { label: string; children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const update = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [update])

  /** Scrolls about one screenful of cards. */
  function page(direction: 1 | -1) {
    const el = trackRef.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {/* Edge to edge on phones (cards peek in from the screen edge); vertical padding keeps hover shadows unclipped. */}
      <div
        ref={trackRef}
        role="list"
        aria-label={label}
        className="scrollbar-hide -mx-2 -my-3 flex snap-x snap-mandatory gap-1 overflow-x-auto scroll-px-2 px-2 py-3 min-[390px]:-mx-4 min-[390px]:gap-2 min-[390px]:scroll-px-4 min-[390px]:px-4 md:mx-0 md:gap-6 md:scroll-px-0 md:px-0"
      >
        {children}
      </div>
      {canPrev && <RailButton direction={-1} onClick={() => page(-1)} />}
      {canNext && <RailButton direction={1} onClick={() => page(1)} />}
    </div>
  )
}

function RailButton({ direction, onClick }: { direction: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction < 0 ? 'Previous products' : 'Next products'}
      className={`absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-black/5 transition hover:scale-105 hover:text-blue-900 md:flex ${
        direction < 0 ? '-left-5' : '-right-5'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={direction < 0 ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </svg>
    </button>
  )
}
