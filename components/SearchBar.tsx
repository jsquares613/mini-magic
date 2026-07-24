'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Functional search box. Submitting navigates to `/search?q=...`, where the
 * results page runs the centralised `searchSite()` query.
 *
 * Note: this intentionally does NOT read `useSearchParams()` — it lives inside
 * the global Header on every (statically-rendered) page, and reading search
 * params there would force a Suspense boundary site-wide. The /search page
 * passes the current query in via `defaultValue` instead.
 */
export default function SearchBar({
  className = '',
  autoFocus = false,
  defaultValue = '',
  size = 'md',
}: {
  className?: string
  autoFocus?: boolean
  defaultValue?: string
  /** `lg` renders the bigger rounded pill used in the mobile header banner. */
  size?: 'md' | 'lg'
}) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const isLarge = size === 'lg'

  return (
    <form onSubmit={submit} className={`relative ${className}`} role="search">
      {isLarge && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      )}
      <input
        type="text"
        placeholder={isLarge ? 'Search for toys, bags, stationery and more…' : 'Search products, categories…'}
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search"
        className={
          isLarge
            ? 'w-full rounded-full bg-white py-3 pl-11 pr-11 text-sm text-gray-800 shadow-md placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-yellow-400'
            : 'w-full rounded-full border border-yellow-300 bg-yellow-100 px-4 py-2 pr-9 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400'
        }
      />
      {isLarge ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15a3 3 0 01-3-3V6a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </span>
      ) : (
        <button
          type="submit"
          aria-label="Submit search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-900"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      )}
    </form>
  )
}
