import Link from 'next/link'
import { getFeaturedCategories } from '@/lib/categories'
import SafeImage from '@/components/SafeImage'

/**
 * Homepage categories rail. Now driven by the category catalogue and links to
 * real `/categories/<slug>` pages (previously linked to non-existent routes
 * like `/categories/house%20hold`).
 */
export default async function Categories() {
  const categories = await getFeaturedCategories(5)

  return (
    <section className="bg-[#FFFFEC] px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-center justify-between">
          <h2 className="text-4xl font-bold text-gray-900">Categories</h2>
          <Link href="/categories" className="font-semibold text-blue-600 hover:text-blue-900">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="group">
              <div className="cursor-pointer overflow-hidden rounded-xl shadow-sm transition hover:scale-105 hover:shadow-lg">
                {category.image ? (
                  <>
                    <div className="relative aspect-square overflow-hidden">
                      <SafeImage
                        src={category.image}
                        alt={category.name}
                        sizes="(min-width: 768px) 20vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="bg-white px-2 py-2 text-center">
                      <p className="text-sm font-bold text-gray-900 md:text-base">{category.name}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`${category.color} flex aspect-square flex-col items-center justify-center p-8`}>
                      <div className="text-5xl">{category.emoji}</div>
                    </div>
                    <div className="bg-white px-2 py-2 text-center">
                      <p className="text-sm font-bold text-gray-800 md:text-base">{category.name}</p>
                    </div>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
