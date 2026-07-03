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
    <footer className="bg-blue-900 px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {/* Brand — full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-2">
              <h3 className="mb-0.5 text-base font-bold">{siteConfig.wordmark}</h3>
              <p className="text-xs text-blue-100">{footerText ?? siteConfig.tagline}</p>
            </div>
            <div className="flex gap-3">
              {siteConfig.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-100 transition hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.iconPath} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-200">Categories</h4>
            <ul className="space-y-1 text-xs text-blue-100">
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
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-200">Quick Links</h4>
            <ul className="space-y-1 text-xs text-blue-100">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.url} className="transition hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-200">Contact</h4>
            <ul className="space-y-1.5 text-xs text-blue-100">
              {contact?.phone && (
                <li className="flex items-center gap-1.5">
                  <span>📱</span>
                  <a href={`tel:${contact.phone}`} className="transition hover:text-white">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.email && (
                <li className="flex items-center gap-1.5">
                  <span>✉️</span>
                  <a href={`mailto:${contact.email}`} className="break-all transition hover:text-white">
                    {contact.email}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-1.5">
                <span>📍</span>
                <span>{siteConfig.contact.location}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-blue-800 pt-4 text-xs text-blue-100 md:flex-row">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name} - All rights reserved</p>
          <div className="flex gap-4">
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
