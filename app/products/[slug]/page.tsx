import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductGrid from '@/components/ProductGrid'
import EnquiryButton from '@/components/EnquiryButton'
import SafeImage from '@/components/SafeImage'
import { getProductBySlug, getRelatedProducts, withPricing } from '@/lib/products'
import { getCategoryBySlug, getCategoryName } from '@/lib/categories'
import { formatPrice } from '@/lib/format'

type PageProps = { params: { slug: string } }

/**
 * ISR, not SSG: admin-managed products must appear without a full site
 * rebuild. No `generateStaticParams` (would require Supabase at *build*
 * time just to enumerate slugs); pages render on first request and are
 * cached for `revalidate` seconds — refreshed immediately on edit via the
 * admin's `revalidatePath` calls (see app/admin/(protected)/products/actions.ts).
 */
export const revalidate = 60

/** Per-product SEO metadata, sourced from product data. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)
  if (!product) return { title: 'Product Not Found - Minimagic' }

  const title = product.seo?.metaTitle ?? `${product.name} - Minimagic`
  const description = product.seo?.metaDescription ?? product.shortDescription
  return {
    title,
    description,
    keywords: product.seo?.keywords ?? product.tags,
    openGraph: { title, description, type: 'website', images: product.images },
    alternates: product.seo?.canonical ? { canonical: product.seo.canonical } : undefined,
  }
}

const STOCK_LABEL: Record<string, { label: string; className: string }> = {
  'in-stock': { label: 'In Stock', className: 'text-green-600' },
  'low-stock': { label: 'Low Stock — order soon', className: 'text-orange-500' },
  'out-of-stock': { label: 'Out of Stock', className: 'text-red-500' },
  'pre-order': { label: 'Available to Pre-order', className: 'text-blue-600' },
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug)
  if (!product) notFound()

  const { effectivePrice, isOnSale, discountPercent } = withPricing(product)
  const [category, related, categoryName] = await Promise.all([
    getCategoryBySlug(product.category),
    getRelatedProducts(product.slug, 4),
    getCategoryName(product.category),
  ])
  const stock = STOCK_LABEL[product.stockStatus] ?? STOCK_LABEL['in-stock']
  const hasImage = product.images.length > 0

  const specs: { label: string; value: string }[] = [
    { label: 'Category', value: categoryName },
    { label: 'Material', value: product.material },
    { label: 'Age Group', value: product.ageGroup },
    { label: 'Color', value: product.color },
  ]

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFFFEC]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-900">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/categories" className="hover:text-blue-900">Categories</Link>
            {category && (
              <>
                <span className="mx-2">›</span>
                <Link href={`/categories/${category.slug}`} className="hover:text-blue-900">
                  {category.name}
                </Link>
              </>
            )}
            <span className="mx-2">›</span>
            <span className="font-semibold text-gray-700">{product.name}</span>
          </nav>

          {/* Main: image + info */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
            {/* Product Image */}
            <div className="relative">
              <div className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl ${product.bg ?? 'bg-yellow-50'}`}>
                {hasImage ? (
                  <SafeImage
                    src={product.images[0]}
                    alt={product.name}
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-[12rem] leading-none">{product.emoji ?? '🎁'}</span>
                )}
                {isOnSale && (
                  <div className="absolute right-4 top-4 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white">
                    -{discountPercent}% OFF
                  </div>
                )}
              </div>
            </div>

            {/* Product Information */}
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
                {categoryName}
              </p>
              <h1 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">{product.name}</h1>

              <p className="mb-4 text-gray-600">{product.shortDescription}</p>

              {/* Price */}
              <div className="mb-4 flex items-center gap-3">
                <span className={`text-3xl font-bold ${isOnSale ? 'text-green-600' : 'text-blue-900'}`}>
                  {formatPrice(effectivePrice)}
                </span>
                {isOnSale && (
                  <span className="text-xl text-gray-400 line-through">{formatPrice(product.price)}</span>
                )}
              </div>

              {/* Availability */}
              <p className={`mb-6 font-semibold ${stock.className}`}>● {stock.label}</p>

              {/* Specs */}
              <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-gray-200 py-5">
                {specs.map((spec) => (
                  <div key={spec.label}>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">{spec.label}</dt>
                    <dd className="font-semibold text-gray-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Full description */}
              <p className="mb-6 leading-relaxed text-gray-600">{product.description}</p>

              {/* Send Enquiry CTA */}
              <div className="flex flex-wrap gap-3">
                <EnquiryButton subject={product.name} source="product" productSlug={product.slug} />
                <Link
                  href={`/categories/${product.category}`}
                  className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 px-8 py-3 font-bold text-blue-900 transition hover:bg-blue-900 hover:text-white"
                >
                  More from {categoryName}
                </Link>
              </div>
            </div>
          </div>

          {/* Why Kids Love It */}
          {product.features.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Why Kids Love It</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      ✓
                    </span>
                    <p className="text-gray-700">{feature}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Products */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">You May Also Like</h2>
              <ProductGrid products={related} />
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
