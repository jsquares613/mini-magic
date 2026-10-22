import { getShuffledPage } from '@/lib/products'
import { dailyShuffleSeed } from '@/lib/rails'
import InfiniteProductGrid from '@/components/InfiniteProductGrid'
import SectionHeader from '@/components/SectionHeader'

/**
 * Homepage "All Products" — the whole catalogue in a grid that grows as you
 * scroll down, shuffled into a new order every day (lib/rails.ts).
 * A homepage extra: if it can't load, the section is skipped rather than
 * taking the page down.
 */
export default async function AllProducts() {
  const seed = dailyShuffleSeed()
  const page = await getShuffledPage(seed, 0).catch((err) => {
    console.error('[AllProducts]', err)
    return null
  })

  if (!page || page.products.length === 0) return null

  return (
    <section className="px-2 py-2 min-[390px]:px-4 md:px-8 md:py-4">
      <div className="mx-auto max-w-7xl">
        <SectionHeader title="All Products" accent="from-sky-400 to-blue-600" viewAllHref="/products" />
        <InfiniteProductGrid
          rail="all-products"
          label="All products"
          initialProducts={page.products}
          initialHasMore={page.hasMore}
          query={{ seed }}
        />
      </div>
    </section>
  )
}
