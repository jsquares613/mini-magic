'use client'

import { useEffect, useRef, useState } from 'react'

type StatCounterProps = {
  /** Target value to count up to. */
  value: number
  /** Optional prefix/suffix, e.g. '₹' or '+', 'k', '%'. */
  prefix?: string
  suffix?: string
  /** Animation duration in ms. */
  duration?: number
  className?: string
}

/**
 * Accessible count-up number. Animates once when scrolled into view and
 * respects `prefers-reduced-motion`. Uses `tabular-nums` so the width stays
 * stable while counting — no layout shift (CLS).
 */
export default function StatCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1500,
  className = '',
}: StatCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const run = () => {
      if (started.current) return
      started.current = true

      if (prefersReduced) {
        setDisplay(value)
        return
      }

      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        // easeOutCubic for a premium, decelerating feel
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplay(Math.round(eased * value))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.4 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {display.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}
