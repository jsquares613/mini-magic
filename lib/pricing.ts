import type { Product, ProductWithPricing } from '@/types'

/**
 * Resolve the effective price + sale metadata for a product. Kept free of data
 * access so ProductCard can also render in the browser (infinite product rails).
 */
export function withPricing(product: Product): ProductWithPricing {
  const isOnSale = product.salePrice != null && product.salePrice < product.price
  const effectivePrice = isOnSale ? (product.salePrice as number) : product.price
  const discountPercent = isOnSale
    ? Math.round(((product.price - (product.salePrice as number)) / product.price) * 100)
    : 0
  return { ...product, effectivePrice, isOnSale, discountPercent }
}
