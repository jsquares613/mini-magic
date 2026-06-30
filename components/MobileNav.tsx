'use client'

import Link from 'next/link'
import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import type { NavigationLink } from '@/lib/supabase/repositories/settings'

/**
 * The interactive slice of the header: the hamburger toggle + the mobile
 * dropdown menu. Pulled out as a small Client Component so `Header` itself can
 * stay an `async` Server Component that fetches nav/announcements from
 * Supabase — only this island ships interactivity JS to the browser.
 */
export default function MobileNav({ navLinks }: { navLinks: NavigationLink[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="text-gray-800 md:hidden"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <div className="mb-4">
            <SearchBar />
          </div>
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.url}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 font-medium text-gray-800 hover:bg-yellow-50 hover:text-blue-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
