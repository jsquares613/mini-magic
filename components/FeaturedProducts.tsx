import { getFeaturedProducts } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import SectionHeader from '@/components/SectionHeader'

/**
 * "Featured Products" rail — manually curated by Admin → Homepage → Featured
 * Products (homepage_featured_products), in admin-defined order. This is the
 * sole "featured" mechanism (products has no featured column — see ARCHITECTURE.md v2).
 */
export default async function FeaturedProducts({ limit = 4 }: { limit?: number }) {
  const products = await getFeaturedProducts(limit)

  if (products.length === 0) return null

  return (
    <section className="bg-white px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Featured"
          accent="from-violet-400 to-fuchsia-500"
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
