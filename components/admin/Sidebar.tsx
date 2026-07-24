'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/admin/(protected)/actions'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import type { Role } from '@/lib/supabase/auth'

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: '📊', exact: true },
  { label: 'Products', href: '/admin/products', icon: '🧸' },
  { label: 'Categories', href: '/admin/categories', icon: '🗂️' },
  { label: 'Homepage', href: '/admin/homepage', icon: '🏠' },
  { label: 'Offers', href: '/admin/offers', icon: '🏷️' },
  { label: 'Play Area', href: '/admin/play-area', icon: '🎪' },
  { label: 'About Us', href: '/admin/about', icon: 'ℹ️' },
  { label: 'Enquiries', href: '/admin/enquiries', icon: '📨' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
]

export default function Sidebar({ email, role }: { email: string | null; role: Role }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const close = () => setOpen(false)

  return (
    <>
      {/* ── Mobile top header ── */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <Link href="/admin" className="text-lg font-bold text-blue-900" onClick={close}>
          Minimagic
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {open ? (
            /* X icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* ── Backdrop (mobile only) ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={[
          // Base: fixed drawer on mobile
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300',
          // Toggle on mobile
          open ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static in flex flow, always visible
          'md:relative md:inset-auto md:z-auto md:w-60 md:flex-shrink-0 md:translate-x-0',
        ].join(' ')}
      >
        {/* Logo — desktop only (mobile uses the fixed header above) */}
        <div className="hidden border-b border-gray-100 px-6 py-5 md:block">
          <Link href="/admin" className="text-xl font-bold text-blue-900">
            Minimagic
          </Link>
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>

        {/* Spacer so nav items don't sit under the mobile header */}
        <div className="h-14 md:hidden" />

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(item.href, item.exact)
                  ? 'bg-blue-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 px-4 py-4">
          <p className="truncate text-sm font-medium text-gray-700">{email}</p>
          <p className="mb-3 text-xs uppercase tracking-wide text-gray-400">{role}</p>
          <ActionForm action={signOut} successMessage="Signed out">
            <SubmitButton pendingText="Signing out…" variant="outline" className="w-full py-2">
              Sign out
            </SubmitButton>
          </ActionForm>
          <Link href="/" target="_blank" className="mt-2 block text-center text-xs text-blue-600 hover:underline">
            View storefront ↗
          </Link>
        </div>
      </aside>
    </>
  )
}
