import { getPopularProducts } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import SectionHeader from '@/components/SectionHeader'

/**
 * "Most Popular" rail — now reads real products and uses the shared
 * ProductCard, so every card links to a working product detail page.
 */
export default async function PopularToys({ limit = 4 }: { limit?: number }) {
  const products = await getPopularProducts(limit)

  return (
    <section className="bg-white px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Most Popular"
          accent="from-rose-400 to-orange-500"
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
