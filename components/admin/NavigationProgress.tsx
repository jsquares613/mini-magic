'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type Phase = 'idle' | 'running' | 'finishing'

/** Navigations that land faster than this (prefetched / cached) never flash the bar. */
const SHOW_AFTER_MS = 120
/** A navigation that never lands (cancelled, failed) can't leave the bar stuck. */
const GIVE_UP_AFTER_MS = 15_000

const STYLE: Record<Phase, React.CSSProperties> = {
  idle: { width: '0%', opacity: 0, transition: 'none' },
  // One long ease-out: quick first stretch, then creeps towards 90 % while the server works.
  running: { width: '90%', opacity: 1, transition: 'width 10s cubic-bezier(0.05, 0.8, 0.1, 1)' },
  finishing: { width: '100%', opacity: 0, transition: 'width 200ms ease-out, opacity 250ms ease 150ms' },
}

/**
 * Thin progress bar along the top of the admin. It starts the moment an internal link is
 * clicked, before the server has answered, and completes when the new URL renders, so every
 * click gets immediate feedback even while a page is still loading.
 */
export default function NavigationProgress() {
  const pathname = usePathname()
  const search = useSearchParams()?.toString() ?? ''
  const [phase, setPhase] = useState<Phase>('idle')
  const pending = useRef(false)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  // Start on clicks that will navigate within the app.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!(a instanceof HTMLAnchorElement)) return
      if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      clearTimers()
      pending.current = true
      setPhase('idle')
      timers.current.push(
        window.setTimeout(() => setPhase('running'), SHOW_AFTER_MS),
        window.setTimeout(() => {
          pending.current = false
          setPhase('idle')
        }, GIVE_UP_AFTER_MS),
      )
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      clearTimers()
    }
  }, [])

  // The new route has rendered (its skeleton or content): finish.
  useEffect(() => {
    if (!pending.current) return
    pending.current = false
    clearTimers()
    setPhase((p) => (p === 'running' ? 'finishing' : 'idle'))
  }, [pathname, search])

  useEffect(() => {
    if (phase !== 'finishing') return
    const t = window.setTimeout(() => setPhase('idle'), 450)
    return () => window.clearTimeout(t)
  }, [phase])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div className="h-full rounded-r-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.55)]" style={STYLE[phase]} />
    </div>
  )
}
