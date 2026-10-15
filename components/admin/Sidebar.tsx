'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/admin/(protected)/actions'
import ActionForm from './ActionForm'
import Spinner from './Spinner'
import SubmitButton from './SubmitButton'
import {
  BadgePercentIcon,
  DashboardIcon,
  ExternalLinkIcon,
  HomeIcon,
  InboxIcon,
  InfoIcon,
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  RefreshIcon,
  SettingsIcon,
  ShapesIcon,
  TentIcon,
  XIcon,
  type Icon,
} from './icons'
import { iconButtonClass } from './ui'
import type { Role } from '@/lib/supabase/auth'

interface NavItem {
  label: string
  href: string
  icon: Icon
  exact?: boolean
}

const NAV: { title?: string; items: NavItem[] }[] = [
  { items: [{ label: 'Dashboard', href: '/admin', icon: DashboardIcon, exact: true }] },
  {
    title: 'Catalogue',
    items: [
      { label: 'Products', href: '/admin/products', icon: PackageIcon },
      { label: 'Marg Sync', href: '/admin/marg', icon: RefreshIcon },
      { label: 'Categories', href: '/admin/categories', icon: ShapesIcon },
    ],
  },
  {
    title: 'Website',
    items: [
      { label: 'Homepage', href: '/admin/homepage', icon: HomeIcon },
      { label: 'Offers', href: '/admin/offers', icon: BadgePercentIcon },
      { label: 'Play Area', href: '/admin/play-area', icon: TentIcon },
      { label: 'About Us', href: '/admin/about', icon: InfoIcon },
      { label: 'Settings', href: '/admin/settings', icon: SettingsIcon },
    ],
  },
  { title: 'Customers', items: [{ label: 'Enquiries', href: '/admin/enquiries', icon: InboxIcon }] },
]

function Monogram({ className = '' }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-xl bg-primary font-extrabold text-blue-900 shadow-sm ring-1 ring-inset ring-black/5 ${className}`}
      aria-hidden="true"
    >
      M
    </span>
  )
}

export default function Sidebar({ email, role }: { email: string | null; role: Role }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  // The section the user just clicked: highlighted at once, before its page has loaded.
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => setPendingHref(null), [pathname])
  useEffect(() => {
    if (!pendingHref) return
    const t = setTimeout(() => setPendingHref(null), 15_000) // navigation never landed
    return () => clearTimeout(t)
  }, [pendingHref])

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const close = () => setOpen(false)

  const onNavClick = (href: string) => (e: React.MouseEvent) => {
    close()
    const newTab = e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
    if (!newTab && href !== pathname) setPendingHref(href)
  }

  return (
    <>
      {/* ── Mobile top header ── */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md md:hidden">
        <Link href="/admin" className="flex items-center gap-2 text-base font-semibold text-slate-900" onClick={close}>
          <Monogram className="h-8 w-8 text-sm" />
          Minimagic
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </header>

      {/* ── Backdrop (mobile only) ── */}
      {open && <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={close} aria-hidden="true" />}

      {/* ── Sidebar panel ── */}
      <aside
        className={[
          // Base: fixed drawer on mobile
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300',
          // Toggle on mobile
          open ? 'translate-x-0' : '-translate-x-full',
          // Desktop: in the flex flow, pinned to the viewport while the page scrolls
          'md:sticky md:inset-auto md:top-0 md:z-auto md:h-screen md:w-60 md:flex-shrink-0 md:translate-x-0',
        ].join(' ')}
      >
        {/* Logo — desktop only (mobile uses the fixed header above) */}
        <Link href="/admin" className="hidden shrink-0 items-center gap-3 px-5 pb-3 pt-5 md:flex">
          <Monogram className="h-9 w-9 text-base" />
          <span>
            <span className="block text-[15px] font-semibold leading-tight text-slate-900">Minimagic</span>
            <span className="block text-xs text-slate-500">Admin panel</span>
          </span>
        </Link>

        {/* Spacer so nav items don't sit under the mobile header */}
        <div className="h-14 shrink-0 md:hidden" />

        <nav className="admin-scroll flex-1 overflow-y-auto px-3 pb-4 pt-2" aria-label="Admin">
          {NAV.map((section, i) => (
            <div key={section.title ?? i} className={i > 0 ? 'mt-4' : ''}>
              {section.title && (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{section.title}</p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const pending = pendingHref === item.href
                  const active = pendingHref ? pending : isActive(item.href, item.exact)
                  const ItemIcon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavClick(item.href)}
                        aria-current={active ? 'page' : undefined}
                        aria-busy={pending || undefined}
                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          active ? 'bg-blue-50 text-blue-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-blue-900" aria-hidden="true" />}
                        <ItemIcon
                          className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-blue-900' : 'text-slate-400 group-hover:text-slate-600'}`}
                        />
                        {item.label}
                        {pending && <Spinner className="ml-auto h-3.5 w-3.5 text-blue-900/60" />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold uppercase text-blue-900">
              {email?.charAt(0) ?? '?'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-800" title={email ?? undefined}>
                {email}
              </span>
              <span className="block text-xs capitalize text-slate-500">{role}</span>
            </span>
            <Link href="/" target="_blank" className={iconButtonClass()} title="View storefront">
              <ExternalLinkIcon className="h-4 w-4" />
              <span className="sr-only">View storefront</span>
            </Link>
            <ActionForm action={signOut} successMessage="Signed out">
              <SubmitButton pendingText="" variant="icon-danger">
                <LogOutIcon className="h-4 w-4" />
                <span className="sr-only">Sign out</span>
              </SubmitButton>
            </ActionForm>
          </div>
        </div>
      </aside>
    </>
  )
}
