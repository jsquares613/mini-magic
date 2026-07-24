'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

interface WishlistContextValue {
  ids: Set<string>
  isSaved: (productId: string) => boolean
  toggle: (productId: string, productSlug: string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

/**
 * Sitewide wishlist state — fetched once here instead of per-card, so every
 * heart icon (product cards + the header badge) shares one source of truth.
 * Identity is the `device_id` cookie set by app/api/wishlist/route.ts.
 */
export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    fetch('/api/wishlist')
      .then((res) => res.json())
      .then((data: { productIds?: string[] }) => {
        if (!cancelled && data.productIds) setIds(new Set(data.productIds))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const isSaved = useCallback((productId: string) => ids.has(productId), [ids])

  const toggle = useCallback(
    async (productId: string, productSlug: string) => {
      const saved = ids.has(productId)
      setIds((prev) => {
        const next = new Set(prev)
        if (saved) next.delete(productId)
        else next.add(productId)
        return next
      })
      try {
        await fetch('/api/wishlist', {
          method: saved ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productSlug }),
        })
      } catch {
        // Revert on network failure.
        setIds((prev) => {
          const next = new Set(prev)
          if (saved) next.add(productId)
          else next.delete(productId)
          return next
        })
      }
    },
    [ids],
  )

  return <WishlistContext.Provider value={{ ids, isSaved, toggle }}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider')
  return ctx
}
