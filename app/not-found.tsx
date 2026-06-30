import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

/** Global 404 page — shown for any unmatched route or `notFound()` call. */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FFFFEC] px-4 py-20 text-center">
        <div>
          <div className="mb-4 text-7xl">🧸</div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Page Not Found</h1>
          <p className="mx-auto mb-8 max-w-md text-gray-600">
            Oops! The page you are looking for has wandered off to the play area. Let’s get you back on track.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/" className="rounded-full bg-blue-900 px-8 py-3 font-bold text-white transition hover:bg-blue-800">
              Back Home
            </Link>
            <Link
              href="/categories"
              className="rounded-full border-2 border-blue-900 px-8 py-3 font-bold text-blue-900 transition hover:bg-blue-900 hover:text-white"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
