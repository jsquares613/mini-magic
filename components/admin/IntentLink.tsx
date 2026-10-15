'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ComponentProps } from 'react'

/** How long the pointer must rest on a link before it counts as intent (sweeping across rows doesn't). */
const HOVER_INTENT_MS = 80

/**
 * Link for table rows and cards. Prefetching every visible row would send dozens of
 * requests per page, so nothing is fetched until the pointer rests on the link (or it is
 * focused or touched). Then Next's "auto" prefetch loads just the route's loading skeleton,
 * so the click switches screens instantly while the page data streams in.
 */
export default function IntentLink({
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onTouchStart,
  ...props
}: Omit<ComponentProps<typeof Link>, 'prefetch'>) {
  const [intent, setIntent] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => cancel, [])

  return (
    <Link
      {...props}
      // false → no prefetch; null → Next's auto prefetch (layout + loading skeleton, no page data).
      prefetch={intent ? null : false}
      onPointerEnter={(e) => {
        onPointerEnter?.(e)
        if (!intent && e.pointerType === 'mouse') {
          cancel()
          timer.current = setTimeout(() => setIntent(true), HOVER_INTENT_MS)
        }
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e)
        cancel()
      }}
      onFocus={(e) => {
        onFocus?.(e)
        setIntent(true)
      }}
      onTouchStart={(e) => {
        onTouchStart?.(e)
        setIntent(true)
      }}
    />
  )
}
