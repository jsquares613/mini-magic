import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductGrid from '@/components/ProductGrid'
import { getAllProducts } from '@/lib/products'

export const metadata: Metadata = {
  title: 'All Products - Minimagic',
  description: 'Browse the full Minimagic collection of toys, bags, stationery and everyday essentials.',
}

// ISR — see app/page.tsx for why this is needed (no dynamic function on this
// page means Next.js would otherwise cache the rendered HTML indefinitely).
export const revalidate = 60

export default async function ProductsPage() {
  const products = await getAllProducts()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFFEC]">
        <div className="mx-auto max-w-7xl px-2 py-4 min-[390px]:px-4 min-[390px]:py-8 md:py-12">
          <nav className="mb-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-900">Home</Link>{' '}
            <span className="mx-2">›</span> <span className="font-semibold">All Products</span>
          </nav>
          <h1 className="mb-1 text-2xl font-bold md:text-5xl">
            All <span className="text-orange-500">Products</span>
          </h1>
          <p className="mb-4 max-w-xl text-sm text-gray-600 md:text-base">
            Our complete collection: {products.length} curated products across every category.
          </p>
          <ProductGrid products={products} />
        </div>
      </main>
      <Footer />
    </>
  )
}
