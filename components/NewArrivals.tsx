import Link from 'next/link'
import { getNewProducts } from '@/lib/products'
import ProductCard from '@/components/ProductCard'

/**
 * "New Arrivals" rail — reads products flagged `isNew` and uses the shared
 * ProductCard (which renders the "New" badge), so every card links through.
 */
export default async function NewArrivals({ limit = 4 }: { limit?: number }) {
  const products = await getNewProducts(limit)

  if (products.length === 0) return null

  return (
    <section className="bg-[#FFFFEC] px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-center justify-between">
          <h2 className="text-4xl font-bold text-gray-900">New Arrivals</h2>
          <Link href="/products" className="font-semibold text-blue-600 hover:text-blue-900">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
