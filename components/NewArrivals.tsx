import { getNewArrivalsPage } from '@/lib/products'
import InfiniteProductRail from '@/components/InfiniteProductRail'
import SectionHeader from '@/components/SectionHeader'

/**
 * "New Arrivals" rail — every current new arrival, newest first, in a row that
 * scrolls sideways and loads more as it goes. Arrivals are automatic (see
 * lib/newArrivals.ts), so a newly published product appears at the front.
 */
export default async function NewArrivals() {
  const { products, hasMore } = await getNewArrivalsPage(0)

  if (products.length === 0) return null

  return (
    <section className="px-2 py-2 min-[390px]:px-4 md:px-8 md:py-4">
      <div className="mx-auto max-w-7xl">
        <SectionHeader title="New Arrivals" accent="from-emerald-400 to-teal-500" viewAllHref="/new-arrivals" />
        <InfiniteProductRail rail="new-arrivals" label="New arrivals" initialProducts={products} initialHasMore={hasMore} eager />
      </div>
    </section>
  )
}
