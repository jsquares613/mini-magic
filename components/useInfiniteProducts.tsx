'use client'

import { useCallback, useRef, useState } from 'react'
import type { Product } from '@/types'
import type { RailKind, RailPage } from '@/lib/rails'

export type InfiniteStatus = 'idle' | 'loading' | 'error' | 'done'

/**
 * Paging state for a homepage product list that grows as you browse: starts with
 * the server-rendered first page and fetches the next from /api/rails/[rail].
 * Shared by the sideways rail and the vertical grid.
 */
export function useInfiniteProducts({
  rail,
  initialProducts,
  initialHasMore,
  query,
}: {
  rail: RailKind
  initialProducts: Product[]
  initialHasMore: boolean
  /** Extra values every page request carries, e.g. the shuffle seed of the first page. */
  query?: Record<string, string>
}) {
  const [products, setProducts] = useState(initialProducts)
  const [status, setStatus] = useState<InfiniteStatus>(initialHasMore ? 'idle' : 'done')
  // Refs, so scroll/intersection handlers always see the latest values.
  const busy = useRef(false)
  const nextOffset = useRef(initialProducts.length)
  const queryRef = useRef(query)
  queryRef.current = query

  const loadMore = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setStatus('loading')
    try {
      const params = new URLSearchParams({ ...queryRef.current, offset: String(nextOffset.current) })
      const res = await fetch(`/api/rails/${rail}?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const page = (await res.json()) as RailPage
      nextOffset.current += page.products.length
      // A product published mid-browse shifts later pages by one; skip any repeats.
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        return [...prev, ...page.products.filter((p) => !seen.has(p.id))]
      })
      setStatus(page.hasMore && page.products.length > 0 ? 'idle' : 'done')
    } catch {
      setStatus('error')
    } finally {
      busy.current = false
    }
  }, [rail])

  return { products, status, loadMore }
}

/** Grey stand-in for a ProductCard while the next page loads. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="aspect-square animate-pulse bg-gray-100" />
      <div className="space-y-1.5 px-1.5 py-2 md:px-3 md:py-3">
        <div className="h-2.5 w-3/4 animate-pulse rounded bg-gray-100 md:h-4" />
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-gray-100 md:h-4" />
      </div>
    </div>
  )
}
