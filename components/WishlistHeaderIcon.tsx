'use client'

import Link from 'next/link'
import { useWishlist } from '@/components/WishlistProvider'

export default function WishlistHeaderIcon({ className = '' }: { className?: string }) {
  const { ids } = useWishlist()
  const count = ids.size

  return (
    <Link href="/wishlist" aria-label="Wishlist" className={`relative flex flex-col items-center gap-0.5 ${className}`}>
      <svg className="h-6 w-6 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20.727c-.29 0-.58-.086-.828-.257C7.267 17.842 3 14.24 3 9.98 3 7.233 5.145 5 7.788 5c1.526 0 2.885.72 3.712 1.848a.62.62 0 001 0C13.327 5.72 14.686 5 16.212 5 18.855 5 21 7.233 21 9.98c0 4.26-4.267 7.862-8.172 10.49-.248.171-.538.257-.828.257z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-2 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
      <span className="text-[11px] font-medium text-gray-700 md:text-xs">Wishlist</span>
    </Link>
  )
}
