import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductGrid from '@/components/ProductGrid'
import { getNewArrivals } from '@/lib/products'

export const metadata: Metadata = {
  title: 'New Arrivals - Minimagic',
  description: 'The latest toys, gifts and goodies to land at Minimagic, newest first.',
}

// ISR — see app/page.tsx. Publishing or syncing products also revalidates it.
export const revalidate = 60

export default async function NewArrivalsPage() {
  const products = await getNewArrivals()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFFEC]">
        <div className="mx-auto max-w-7xl px-2 py-4 min-[390px]:px-4 min-[390px]:py-8 md:py-12">
          <nav className="mb-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-900">Home</Link>{' '}
            <span className="mx-2">›</span> <span className="font-semibold">New Arrivals</span>
          </nav>
          <h1 className="mb-1 text-2xl font-bold md:text-5xl">
            New <span className="text-emerald-600">Arrivals</span>
          </h1>
          <p className="mb-4 max-w-xl text-sm text-gray-600 md:text-base">
            Fresh in store: the latest toys and goodies to land at Minimagic, newest first.
          </p>
          <ProductGrid products={products} emptyMessage="New products are on their way — check back soon!" />
        </div>
      </main>
      <Footer />
    </>
  )
}
