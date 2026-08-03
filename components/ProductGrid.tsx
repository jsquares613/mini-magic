import type { Product } from '@/types'
import ProductCard from '@/components/ProductCard'

/**
 * Responsive grid of {@link ProductCard}s with a friendly empty state.
 * Reused by category pages, search, offers and related-products rails.
 */
export default function ProductGrid({
  products,
  emptyMessage = 'No products found.',
}: {
  products: Product[]
  emptyMessage?: string
}) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-xl text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1 min-[390px]:gap-2 md:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
