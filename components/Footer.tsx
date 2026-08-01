import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { getContactInfo, getFooterQuickLinks, getFooterText } from '@/lib/settings'

/**
 * Footer — a presentational `async` Server Component driven by Supabase
 * content (Phase 3): categories, footer quick links, socials and contact
 * info are all admin-editable data. Brand identity (wordmark/tagline-fallback)
 * and legal links stay in `config/site.ts` — there is no dedicated table for
 * those yet (see docs/ARCHITECTURE.md scope notes).
 */
export default async function Footer() {
  const [quickLinks, contact, footerText] = await Promise.all([
    getFooterQuickLinks(),
    getContactInfo(),
    getFooterText(),
  ])

  return (
    <footer className="hidden text-white md:block">
      {/* Upper section — columns + watermark */}
      <div className="relative min-h-[480px] overflow-hidden bg-blue-900 px-4 pb-0 pt-10 md:px-8 md:pt-12">
        {/* Background watermark — natural aspect ratio, anchored to bottom edge */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/text.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 w-[85%] -translate-x-1/2 select-none"
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/Minimagic White-01.png" alt={siteConfig.name} className="mb-1 h-10 w-auto" />
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
                    className={`transition hover:text-white ${social.color ?? 'text-blue-100'}`}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.iconPath} />
                    </svg>
                  </a>
                ))}
              </div>
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

            {/* Contact */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-200">Contact</h4>
              <ul className="space-y-1.5 text-xs text-blue-100">
                {contact?.phone && (
                  <li className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-blue-300" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    <a href={`tel:${contact.phone}`} className="transition hover:text-white">
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact?.email && (
                  <li className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-blue-300" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <a href={`mailto:${contact.email}`} className="break-all transition hover:text-white">
                      {contact.email}
                    </a>
                  </li>
                )}
                <li className="flex items-start gap-1.5">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-300" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span>{siteConfig.contact.location}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-blue-900">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col items-center justify-between gap-2 border-t border-blue-800 py-4 text-xs text-blue-100 md:flex-row">
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
      </div>
    </footer>
  )
}
