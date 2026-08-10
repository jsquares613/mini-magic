import Link from 'next/link'
import { siteConfig } from '@/config/site'
import SearchBar from '@/components/SearchBar'
import WishlistHeaderIcon from '@/components/WishlistHeaderIcon'
import { getAnnouncements, getHeaderNav, getMarqueeEnabled } from '@/lib/settings'

export default async function Header() {
  const [navLinks, announcements, marqueeEnabled] = await Promise.all([
    getHeaderNav(),
    getAnnouncements(),
    getMarqueeEnabled(),
  ])
  const marqueeMessages = announcements.length ? announcements : siteConfig.announcements

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Announcement bar — always visible; scrolling can be toggled by admin */}
      <div className="overflow-hidden bg-primary px-4 py-1.5 text-sm">
        {marqueeEnabled ? (
          <div className="marquee">
            <div className="marquee-content">
              {Array(8).fill(null).flatMap(() => marqueeMessages).map((msg, i) => (
                <span key={i} className="px-4 font-semibold">
                  {msg}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-8">
            {marqueeMessages.map((msg, i) => (
              <span key={i} className="px-4 font-semibold">
                {msg}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mobile banner: logo + tagline, wishlist icon, no cart */}
      <div className="bg-gradient-to-b from-primary to-yellow-200 px-4 pb-3 pt-3 md:hidden">
        <div className="mb-3 flex items-start justify-between">
          <Link href="/">
            {/* Logo is a static SVG; next/image can't optimize SVGs (see SafeImage). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={siteConfig.logo} alt={`${siteConfig.name} Logo`} className="h-8 w-auto" />
            <p className="mt-0.5 text-[10px] font-medium text-blue-900/80">{siteConfig.tagline}</p>
          </Link>
          <WishlistHeaderIcon />
        </div>
        <SearchBar size="lg" />
      </div>

      {/* Main Header (desktop) */}
      <nav className="relative mx-auto hidden max-w-7xl items-center justify-between px-4 py-4 md:flex">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/">
            {/* Logo is a static SVG; next/image can't optimize SVGs (see SafeImage). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
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

        {/* Search + wishlist (desktop) */}
        <div className="hidden flex-1 items-center justify-end gap-6 md:flex">
          <SearchBar className="w-64" />
          <WishlistHeaderIcon />
        </div>
      </nav>
    </header>
  )
}
