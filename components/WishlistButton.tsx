'use client'

import { useWishlist } from '@/components/WishlistProvider'

export default function WishlistButton({
  productId,
  productSlug,
  productName,
  variant = 'icon',
}: {
  productId: string
  productSlug: string
  productName: string
  /** 'icon' for the compact heart used on product cards, 'button' for a labeled CTA. */
  variant?: 'icon' | 'button'
}) {
  const { isSaved, toggle } = useWishlist()
  const saved = isSaved(productId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(productId, productSlug)
  }

  const heart = (
    <svg
      className={variant === 'button' ? 'h-5 w-5' : 'h-2.5 w-2.5 md:h-4 md:w-4'}
      viewBox="0 0 24 24"
      fill={saved ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.727c-.29 0-.58-.086-.828-.257C7.267 17.842 3 14.24 3 9.98 3 7.233 5.145 5 7.788 5c1.526 0 2.885.72 3.712 1.848a.62.62 0 001 0C13.327 5.72 14.686 5 16.212 5 18.855 5 21 7.233 21 9.98c0 4.26-4.267 7.862-8.172 10.49-.248.171-.538.257-.828.257z"
      />
    </svg>
  )

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-red-500 px-8 py-3 font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
      >
        {heart}
        {saved ? 'Saved to Wishlist' : 'Save to Wishlist'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      aria-pressed={saved}
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white text-red-500 shadow-sm ring-1 ring-black/5 transition hover:scale-110 md:h-8 md:w-8"
    >
      {heart}
    </button>
  )
}
