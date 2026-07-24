import type { Metadata, Viewport } from 'next'
import './globals.css'
import { siteConfig } from '@/config/site'
import WishlistProvider from '@/components/WishlistProvider'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Find Joy in Every Toy`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ['toys', 'kids toys', 'stationery', 'play area', 'minimagic'],
  openGraph: {
    title: `${siteConfig.name} - Find Joy in Every Toy`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Find Joy in Every Toy`,
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
        <WishlistProvider>
          <div className="pb-32 md:pb-0">{children}</div>
          <BottomNav />
        </WishlistProvider>
      </body>
    </html>
  )
}
