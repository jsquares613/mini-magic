import Link from 'next/link'
import { getFeaturedCategories } from '@/lib/categories'
import SafeImage from '@/components/SafeImage'
import SectionHeader from '@/components/SectionHeader'

/**
 * Homepage categories rail. Now driven by the category catalogue and links to
 * real `/categories/<slug>` pages (previously linked to non-existent routes
 * like `/categories/house%20hold`).
 */
export default async function Categories() {
  const categories = await getFeaturedCategories(5)

  return (
    <section className="bg-white px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Categories"
          accent="from-amber-400 to-yellow-500"
          viewAllHref="/categories"
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="group">
              <div className="cursor-pointer overflow-hidden rounded-2xl bg-lightYellow shadow-sm ring-2 ring-amber-400 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-amber-500">
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
                    <div className="border-t-2 border-amber-400 bg-amber-400 px-2 py-3 text-center">
                      <p className="text-sm font-bold text-blue-900 md:text-base">{category.name}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`${category.color} flex aspect-square flex-col items-center justify-center p-8`}>
                      <div className="text-5xl transition-transform duration-300 group-hover:scale-110">{category.emoji}</div>
                    </div>
                    <div className="border-t-2 border-amber-400 bg-amber-400 px-2 py-3 text-center">
                      <p className="text-sm font-bold text-blue-900 md:text-base">{category.name}</p>
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
