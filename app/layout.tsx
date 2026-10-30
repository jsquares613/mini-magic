import type { Metadata, Viewport } from 'next'
import './globals.css'
import { siteConfig } from '@/config/site'
import SiteShell from '@/components/SiteShell'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Spend Less, Shop More`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ['toys', 'kids toys', 'stationery', 'play area', 'minimagic'],
  openGraph: {
    title: `${siteConfig.name} - Spend Less, Shop More`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Spend Less, Shop More`,
    description: siteConfig.description,
  },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
