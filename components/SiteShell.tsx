'use client'

import { usePathname } from 'next/navigation'
import WishlistProvider from './WishlistProvider'
import BottomNav from './BottomNav'

/**
 * Storefront chrome around every route: wishlist state, the mobile tab bar and the
 * space reserved for it. The admin panel shares the root layout, so it keeps the same
 * tree but skips the wishlist fetch and the tab-bar spacing (BottomNav hides itself).
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const isAdmin = usePathname().startsWith('/admin')
  return (
    <WishlistProvider enabled={!isAdmin}>
      <div className={isAdmin ? undefined : 'pb-32 md:pb-0'}>{children}</div>
      <BottomNav />
    </WishlistProvider>
  )
}
