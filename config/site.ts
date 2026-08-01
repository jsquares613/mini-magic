/**
 * Single source of truth for site-wide configuration: brand identity, contact
 * details, navigation and footer structure.
 *
 * Everything here is data — components read from it instead of hardcoding
 * strings. To rebrand, change phone numbers, or restructure the nav, edit this
 * one file (or, later, fetch the same shape from a CMS/admin API).
 */

export interface NavLink {
  label: string
  href: string
}

export interface SocialLink {
  label: string
  href: string
  /** Inline SVG path data, rendered by the Footer. */
  iconPath: string
  /** Optional Tailwind text-color class override, e.g. "text-yellow-400". */
  color?: string
}

export const siteConfig = {
  name: 'Minimagic',
  /** Lowercase wordmark used in the footer. */
  wordmark: 'minimagic',
  tagline: 'Making Everyday Moments More Magical',
  description:
    'Discover toys, games & everyday essentials for every age with Minimagic — safe, joyful and affordably priced.',
  /** Used as metadataBase for absolute OG URLs. */
  url: 'https://minimagic.example.com',
  logo: '/images/logo.svg',

  contact: {
    phone: '+91 72594 07351',
    /** Tel: href-safe version. */
    phoneHref: 'tel:+917259407351',
    email: 'minimagic@gmail.com',
    location: 'MINI MAGIC, U.K. Dream Centre, Kallapu, Mangalore – 575017',
    /** Used to compose enquiry links / WhatsApp etc. */
    whatsapp: '+917259407351',
  },

  /** Primary header navigation. */
  mainNav: [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'Offers', href: '/offers' },
    { label: 'Play Area', href: '/play-area' },
    { label: 'About us', href: '/about' },
  ] satisfies NavLink[],

  /** Footer "Quick Links" column. */
  quickLinks: [
    { label: 'About Us', href: '/about' },
    { label: 'Offers', href: '/offers' },
    { label: 'Play Area', href: '/play-area' },
    { label: 'Contact', href: '/contact' },
  ] satisfies NavLink[],

  /** Footer legal links (single /policies page with anchors — no dead links). */
  legalLinks: [
    { label: 'Cookie Policy', href: '/policies#cookies' },
    { label: 'Privacy Policy', href: '/policies#privacy' },
    { label: 'Terms & Policies', href: '/policies#terms' },
  ] satisfies NavLink[],

  /**
   * Social profiles. Replace the URLs with the brand's real handles; the SVG
   * path is the icon glyph rendered inside a 24×24 viewBox.
   */
  socials: [
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/minimagic_in?igsh=aWk3ZmI1azY5YnVx',
      iconPath:
        'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
      color: 'text-yellow-400',
    },
  ] satisfies SocialLink[],

  /** Scrolling banner messages in the header. */
  announcements: [
    'Special Weekend Offers Available In-Store',
    'New Arrivals Just Landed',
    'Birthday Gift Collections Available',
  ],
} as const

export type SiteConfig = typeof siteConfig
