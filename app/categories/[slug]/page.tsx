import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SubcategoryFilter from '@/components/SubcategoryFilter'
import { getCategoryBySlug, getSubcategoriesByCategoryId } from '@/lib/categories'
import { getProductsByCategory } from '@/lib/products'
import { repositories } from '@/lib/supabase'

type PageProps = { params: { slug: string } }

/**
 * ISR, not SSG: admin-managed categories must appear without a full site
 * rebuild. No `generateStaticParams` (would require Supabase at *build*
 * time just to enumerate slugs); pages render on first request and are
 * cached for `revalidate` seconds — refreshed immediately on edit via the
 * admin's `revalidatePath` calls (see app/admin/(protected)/categories/actions.ts).
 */
export const revalidate = 60

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug)
  if (!category) return { title: 'Category Not Found - Minimagic' }
  const title = category.seo?.metaTitle ?? `${category.name} - Minimagic`
  const description = category.seo?.metaDescription ?? category.description
  return {
    title,
    description,
    keywords: category.seo?.keywords,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const category = await getCategoryBySlug(params.slug)
  if (!category) notFound()

  const [products, promotions, subcategories] = await Promise.all([
    getProductsByCategory(category.slug),
    repositories.categories.getCategoryPromotions(category.id),
    getSubcategoriesByCategoryId(category.id),
  ])
  const promo = promotions[0]

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFFFEC]">
        <div className="mx-auto max-w-7xl px-2 py-4 min-[390px]:px-4 min-[390px]:py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-900">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/categories" className="hover:text-blue-900">Categories</Link>
            <span className="mx-2">›</span>
            <span className="font-semibold text-gray-700">{category.name}</span>
          </nav>

          {/* Category heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{category.name}</h1>
            {promo && (
              <span className="mt-3 inline-block rounded-full bg-red-500 px-4 py-1 text-sm font-bold text-white">
                {promo.badge_text ?? promo.title}
              </span>
            )}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
            <Link href="/categories" className="text-sm font-semibold text-blue-600 hover:text-blue-900">
              ← All Categories
            </Link>
          </div>

          <SubcategoryFilter subcategories={subcategories} products={products} />
        </div>
      </main>

      <Footer />
    </>
  )
}
