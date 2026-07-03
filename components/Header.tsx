import Link from 'next/link'
import { siteConfig } from '@/config/site'
import SearchBar from '@/components/SearchBar'
import MobileNav from '@/components/MobileNav'
import { getAnnouncements, getHeaderNav } from '@/lib/settings'

/**
 * Header — an `async` Server Component. Nav links and the announcement
 * marquee are admin-editable data (Phase 3); logo/site name stay brand-level
 * static config. Mobile menu interactivity lives in the `MobileNav` client
 * island so this component itself ships zero client JS.
 */
export default async function Header() {
  const [navLinks, announcements] = await Promise.all([getHeaderNav(), getAnnouncements()])
  const marqueeMessages = announcements.length ? announcements : siteConfig.announcements

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Banner */}
      <div className="overflow-hidden bg-[#FFB800] px-4 py-2 text-sm">
        <div className="marquee">
          <div className="marquee-content">
            {Array(8).fill(null).flatMap(() => marqueeMessages).map((msg, i) => (
              <span key={i} className="px-4 font-semibold">
                {msg}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/">
            <img src={siteConfig.logo} alt={`${siteConfig.name} Logo`} className="h-10 w-auto" />
          </Link>
        </div>

        {/* Nav Links (desktop) */}
        <div className="hidden flex-1 justify-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link key={link.id} href={link.url} className="font-medium text-gray-800 hover:text-blue-900">
              {link.label}
            </Link>
          ))}
        </div>

        {/* Search (desktop) */}
        <div className="hidden flex-1 justify-end md:flex">
          <SearchBar className="w-64" />
        </div>

        {/* Mobile menu (interactive island) */}
        <MobileNav navLinks={navLinks} />
      </nav>
    </header>
  )
}
