'use client'

import { useEffect, useRef } from 'react'
import ProductCard from '@/components/ProductCard'
import { ProductCardSkeleton, useInfiniteProducts } from '@/components/useInfiniteProducts'
import type { Product } from '@/types'
import type { RailKind } from '@/lib/rails'

/**
 * A homepage product grid that grows downwards: the next page loads as the
 * bottom comes into view, up to `autoLoadLimit` products — after that a "Show
 * more" button takes over, so the footer below stays reachable.
 */
export default function InfiniteProductGrid({
  rail,
  label,
  initialProducts,
  initialHasMore,
  query,
  autoLoadLimit = 48,
}: {
  rail: RailKind
  label: string
  initialProducts: Product[]
  initialHasMore: boolean
  /** Extra values every page request carries, e.g. the shuffle seed of the first page. */
  query?: Record<string, string>
  /** Products to load on scroll before switching to a button. */
  autoLoadLimit?: number
}) {
  const { products, status, loadMore } = useInfiniteProducts({ rail, initialProducts, initialHasMore, query })
  const sentinelRef = useRef<HTMLDivElement>(null)
  const autoLoad = status === 'idle' && products.length < autoLoadLimit

  // Re-armed after every page (keyed on the product count — a fast, cached response
  // can skip the "loading" render): a new observer reports straight away if the end
  // is still in reach, so a short page keeps filling the screen.
  const count = products.length
  useEffect(() => {
    const el = sentinelRef.current
    if (!autoLoad || !el) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore()
    }, { rootMargin: '600px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [autoLoad, loadMore, count])

  return (
    <>
      <div
        role="list"
        aria-label={label}
        aria-busy={status === 'loading' || undefined}
        className="grid grid-cols-3 gap-1 min-[390px]:gap-2 md:gap-6 lg:grid-cols-4"
      >
        {products.map((product) => (
          <div key={product.id} role="listitem">
            <ProductCard product={product} />
          </div>
        ))}
        {status === 'loading' &&
          [0, 1, 2, 3].map((k) => (
            // The 4th placeholder only shows where rows have 4 cards.
            <div key={`loading-${k}`} role="listitem" aria-hidden="true" className={k === 3 ? 'hidden lg:block' : ''}>
              <ProductCardSkeleton />
            </div>
          ))}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />

      {(status === 'error' || (status === 'idle' && !autoLoad)) && (
        <div className="mt-4 flex justify-center md:mt-8">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-700 hover:text-white hover:ring-blue-700"
          >
            {status === 'error' ? 'Couldn’t load more — try again' : 'Show more products'}
          </button>
        </div>
      )}
    </>
  )
}
