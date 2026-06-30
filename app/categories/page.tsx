import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductGrid from '@/components/ProductGrid'
import CategoryFilter from '@/components/CategoryFilter'
import Link from 'next/link'
import { getAllProducts } from '@/lib/products'
import { getAllCategories } from '@/lib/categories'

// ISR — see app/page.tsx for why this is needed (no dynamic function on this
// page means Next.js would otherwise cache the rendered HTML indefinitely).
export const revalidate = 60

export default async function CategoriesPage() {
  const [categories, allProducts] = await Promise.all([getAllCategories(), getAllProducts()])

  // Pre-render one grid per category server-side; the client filter just
  // swaps which already-rendered grid is visible (see CategoryFilter).
  const groups: Record<string, React.ReactNode> = {
    all: <ProductGrid products={allProducts} />,
  }
  for (const category of categories) {
    groups[category.slug] = (
      <ProductGrid products={allProducts.filter((p) => p.category === category.slug)} />
    )
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFFFEC]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <nav className="mb-3 text-sm text-gray-500">
                <Link href="/" className="hover:text-blue-900">Home</Link>{' '}
                <span className="mx-2">›</span> <span className="font-semibold">Categories</span>
              </nav>
              <h1 className="text-4xl font-bold md:text-5xl">
                Explore Our <span className="text-orange-500">Collection</span>
              </h1>
              <p className="mt-3 max-w-xl text-gray-600">
                Browse toys, accessories and everyday essentials for kids and families.
              </p>
            </div>

            <div className="hidden flex-col items-end md:flex">
              <div className="flex gap-3">
                <div className="rounded-full bg-yellow-500 px-4 py-2 font-bold text-white">
                  {allProducts.length} Products
                </div>
                <div className="rounded-full bg-blue-900 px-4 py-2 font-bold text-white">
                  {categories.length} Categories
                </div>
              </div>
            </div>
          </div>

          <CategoryFilter
            chips={categories.map((c) => ({ slug: c.slug, label: c.name }))}
            groups={groups}
          />
        </div>
      </main>

      <Footer />
    </>
  )
}
