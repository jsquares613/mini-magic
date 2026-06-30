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
}: {
  className?: string
  autoFocus?: boolean
  defaultValue?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form onSubmit={submit} className={`relative ${className}`} role="search">
      <input
        type="text"
        placeholder="Search products, categories…"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search"
        className="w-full rounded-full border border-yellow-300 bg-yellow-100 px-4 py-2 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
      <button
        type="submit"
        aria-label="Submit search"
        className="absolute right-3 top-2.5 text-gray-600 hover:text-blue-900"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  )
}
