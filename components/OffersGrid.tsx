import { getProductsOnOffer } from '@/lib/products'
import ProductGrid from '@/components/ProductGrid'

/**
 * Grid of products currently on offer. Reads via `getProductsOnOffer()` (sorted
 * by deepest discount) and renders shared ProductCards — which already show the
 * sale price, strike-through and discount badge.
 */
export default async function OffersGrid({ limit }: { limit?: number }) {
  const offers = await getProductsOnOffer(limit)

  return (
    <ProductGrid products={offers} emptyMessage="No offers available at the moment." />
  )
}
