import Link from 'next/link'
import { searchSite } from '@/lib/search'
import SearchBar from '@/components/SearchBar'
import type { SearchResult } from '@/types'

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  product: 'Product',
  category: 'Category',
  'play-area': 'Play Area',
}

/**
 * Renders search results for a given query. An `async` Server Component —
 * `query` comes from the `/search` page's `searchParams` prop, and
 * `searchSite()` (Supabase-backed) runs server-side per request.
 */
export default async function SearchResults({ query }: { query: string }) {
  const results = query ? await searchSite(query) : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <nav className="mb-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-900">Home</Link>{' '}
        <span className="mx-2">›</span> <span className="font-semibold">Search</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold md:text-4xl">
        {query ? <>Results for “<span className="text-orange-500">{query}</span>”</> : 'Search'}
      </h1>
      <p className="mb-6 text-gray-600">
        {query ? `${results.length} ${results.length === 1 ? 'result' : 'results'} found` : 'Type to search the store.'}
      </p>

      <div className="mb-8 max-w-md">
        <SearchBar defaultValue={query} />
      </div>

      {query && results.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <div className="mb-3 text-5xl">🔍</div>
          <p className="text-lg font-semibold text-gray-700">No results for “{query}”.</p>
          <p className="mt-1 text-gray-500">Try a different keyword, or browse our categories.</p>
          <Link
            href="/categories"
            className="mt-5 inline-block rounded-full bg-blue-900 px-6 py-2 font-semibold text-white hover:bg-blue-800"
          >
            Browse Categories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.href}`}
              href={result.href}
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-lg"
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-3xl">
                {result.emoji ?? '🔎'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase text-blue-700">{TYPE_LABEL[result.type]}</span>
                <h3 className="truncate font-bold text-gray-900">{result.title}</h3>
                <p className="line-clamp-2 text-sm text-gray-500">{result.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
