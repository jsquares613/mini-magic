import { getOffersPage } from '@/lib/products'
import InfiniteProductRail from '@/components/InfiniteProductRail'
import SectionHeader from '@/components/SectionHeader'

/**
 * Homepage "Special Offers" — every product on offer, deepest discount first, in
 * a row that scrolls sideways and loads more as it goes. Hidden when nothing is
 * on offer; the full list with category filters is /offers.
 */
export default async function OffersRail() {
  const { products, hasMore } = await getOffersPage(0)

  if (products.length === 0) return null

  return (
    <section className="px-2 py-2 min-[390px]:px-4 md:px-8 md:py-4">
      <div className="mx-auto max-w-7xl">
        <SectionHeader title="Special Offers" accent="from-red-400 to-rose-500" viewAllHref="/offers" />
        <InfiniteProductRail rail="offers" label="Special offers" initialProducts={products} initialHasMore={hasMore} />
      </div>
    </section>
  )
}
