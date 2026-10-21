import { getNewProducts } from '@/lib/products'
import { NEW_ARRIVALS_RAIL_SIZE } from '@/lib/newArrivals'
import ProductCard from '@/components/ProductCard'
import ProductRail from '@/components/ProductRail'
import SectionHeader from '@/components/SectionHeader'

/**
 * "New Arrivals" rail — the newest arrivals, newest first, in a row that
 * scrolls sideways. Arrivals are automatic (see lib/newArrivals.ts), so each new
 * product published pushes the oldest one out; "View all" opens /new-arrivals.
 */
export default async function NewArrivals() {
  const products = await getNewProducts(NEW_ARRIVALS_RAIL_SIZE)

  if (products.length === 0) return null

  return (
    <section className="px-2 py-2 min-[390px]:px-4 md:px-8 md:py-4">
      <div className="mx-auto max-w-7xl">
        <SectionHeader title="New Arrivals" accent="from-emerald-400 to-teal-500" viewAllHref="/new-arrivals" />

        {/* ~2½ cards on phones (the cut-off one invites a swipe), 4 on tablets, 5 on desktops */}
        <ProductRail label="New arrivals">
          {products.map((product) => (
            <div
              key={product.id}
              role="listitem"
              className="w-[38%] shrink-0 snap-start sm:w-[30%] md:w-[calc((100%-4.5rem)/4)] lg:w-[calc((100%-6rem)/5)]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </ProductRail>
      </div>
    </section>
  )
}
