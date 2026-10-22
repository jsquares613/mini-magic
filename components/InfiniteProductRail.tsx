'use client'

import ProductCard from '@/components/ProductCard'
import ProductRail from '@/components/ProductRail'
import { ProductCardSkeleton, useInfiniteProducts } from '@/components/useInfiniteProducts'
import type { Product } from '@/types'
import type { RailKind } from '@/lib/rails'

/** Card width per breakpoint: ~2½ on phones (the cut-off card invites a swipe), 4 on tablets, 5 on desktops. */
const ITEM = 'w-[38%] shrink-0 snap-start sm:w-[30%] md:w-[calc((100%-4.5rem)/4)] lg:w-[calc((100%-6rem)/5)]'

/**
 * A homepage product rail with no fixed length: it starts with the server-rendered
 * first page and fetches the next one whenever the end of the row comes within
 * a screen — swiping, scrolling or using the arrows.
 */
export default function InfiniteProductRail({
  rail,
  label,
  initialProducts,
  initialHasMore,
  eager = false,
  query,
}: {
  rail: RailKind
  label: string
  initialProducts: Product[]
  initialHasMore: boolean
  /** Near the top of the page: load the first cards' images straight away. */
  eager?: boolean
  /** Extra values every page request carries, e.g. the shuffle seed of the first page. */
  query?: Record<string, string>
}) {
  const { products, status, loadMore } = useInfiniteProducts({ rail, initialProducts, initialHasMore, query })

  return (
    <ProductRail label={label} busy={status === 'loading'} onNearEnd={status === 'idle' ? loadMore : undefined}>
      {products.map((product, i) => (
        <div key={product.id} role="listitem" className={ITEM}>
          <ProductCard product={product} index={eager ? i : undefined} />
        </div>
      ))}

      {status === 'loading' &&
        [0, 1].map((k) => (
          <div key={`loading-${k}`} role="listitem" aria-hidden="true" className={ITEM}>
            <ProductCardSkeleton />
          </div>
        ))}

      {status === 'error' && (
        <div role="listitem" className={ITEM}>
          <button
            type="button"
            onClick={loadMore}
            className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl bg-white p-2 text-center text-[11px] font-semibold text-blue-900 shadow-sm ring-1 ring-black/5 transition hover:bg-blue-50 md:text-sm"
          >
            Couldn’t load more
            <span className="font-normal text-gray-500 underline">Try again</span>
          </button>
        </div>
      )}
    </ProductRail>
  )
}
