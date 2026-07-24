import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductGrid from '@/components/ProductGrid'
import { getWishlistProducts } from '@/lib/products'

export const metadata: Metadata = {
  title: 'Wishlist - Minimagic',
  description: 'Products you have saved for later at Minimagic.',
}

export const revalidate = 0

export default async function WishlistPage() {
  const deviceId = cookies().get('device_id')?.value
  const products = deviceId ? await getWishlistProducts(deviceId) : []

  return (
    <>
      <Header />

      <main className="min-h-screen bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          <nav className="mb-3 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-900">Home</Link>{' '}
            <span className="mx-2">›</span> <span className="font-semibold">Wishlist</span>
          </nav>
          <h1 className="mb-8 text-4xl font-bold md:text-5xl">My Wishlist</h1>

          <ProductGrid
            products={products}
            emptyMessage="Your wishlist is empty — tap the heart on any product to save it here."
          />
        </div>
      </main>

      <Footer />
    </>
  )
}
