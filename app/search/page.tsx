import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SearchResults from '@/components/SearchResults'

export const metadata: Metadata = {
  title: 'Search - Minimagic',
  description: 'Search products, categories and play-area experiences at Minimagic.',
}

/**
 * Server-rendered search: the query comes from the `searchParams` prop Next.js
 * passes to every page, so no `useSearchParams()`/Suspense workaround is
 * needed — `searchSite()` (Supabase-backed, Phase 3) runs server-side per request.
 */
export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q ?? ''

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFFEC]">
        <SearchResults query={query} />
      </main>
      <Footer />
    </>
  )
}
