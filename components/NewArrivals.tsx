import { getNewProducts } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import SectionHeader from '@/components/SectionHeader'

/**
 * "New Arrivals" rail — reads products flagged `isNew` and uses the shared
 * ProductCard (which renders the "New" badge), so every card links through.
 */
export default async function NewArrivals({ limit = 4 }: { limit?: number }) {
  const products = await getNewProducts(limit)

  if (products.length === 0) return null

  return (
    <section className="bg-white px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="New Arrivals"
          accent="from-emerald-400 to-teal-500"
          viewAllHref="/products"
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
