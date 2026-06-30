import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { getAllCategories } from '@/lib/categories'
import { getContactInfo, getFooterQuickLinks, getFooterText } from '@/lib/settings'

/**
 * Footer — a presentational `async` Server Component driven by Supabase
 * content (Phase 3): categories, footer quick links, socials and contact
 * info are all admin-editable data. Brand identity (wordmark/tagline-fallback)
 * and legal links stay in `config/site.ts` — there is no dedicated table for
 * those yet (see docs/ARCHITECTURE.md scope notes).
 */
export default async function Footer() {
  const [categories, quickLinks, contact, footerText] = await Promise.all([
    getAllCategories(),
    getFooterQuickLinks(),
    getContactInfo(),
    getFooterText(),
  ])

  return (
    <footer className="bg-blue-900 px-4 py-10 text-white md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid grid-cols-2 gap-6 md:mb-12 md:grid-cols-4 md:gap-8">
          {/* Brand — full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 md:mb-4">
              <h3 className="mb-1 text-xl font-bold md:mb-2 md:text-2xl">{siteConfig.wordmark}</h3>
              <p className="text-sm text-blue-100">{footerText ?? siteConfig.tagline}</p>
            </div>
            <div className="flex gap-4">
              {siteConfig.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-100 transition hover:text-white"
                >
                  <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.iconPath} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-200 md:mb-4 md:text-lg md:font-bold md:normal-case md:tracking-normal md:text-white">Categories</h4>
            <ul className="space-y-1.5 text-sm text-blue-100 md:space-y-2">
              <li>
                <Link href="/play-area" className="transition hover:text-white">Play Area</Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/categories/${category.slug}`} className="transition hover:text-white">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-200 md:mb-4 md:text-lg md:font-bold md:normal-case md:tracking-normal md:text-white">Quick Links</h4>
            <ul className="space-y-1.5 text-sm text-blue-100 md:space-y-2">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.url} className="transition hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-200 md:mb-4 md:text-lg md:font-bold md:normal-case md:tracking-normal md:text-white">Contact</h4>
            <ul className="space-y-2 text-sm text-blue-100 md:space-y-3">
              {contact?.phone && (
                <li className="flex items-center gap-2">
                  <span>📱</span>
                  <a href={`tel:${contact.phone}`} className="transition hover:text-white">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.email && (
                <li className="flex items-center gap-2">
                  <span>✉️</span>
                  <a href={`mailto:${contact.email}`} className="transition hover:text-white break-all">
                    {contact.email}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2">
                  <span>📍</span>
                  <span>{siteConfig.contact.location}</span>
                </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-blue-800 pt-6 text-xs text-blue-100 md:mt-8 md:flex-row md:pt-8 md:text-sm">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name} - All rights reserved</p>
          <div className="flex gap-4 md:gap-6">
            {siteConfig.legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
