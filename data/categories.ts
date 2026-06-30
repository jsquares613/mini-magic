import type { Category } from '@/types'

/**
 * The canonical category catalogue — the ONLY place categories are defined.
 *
 * `slug` is the URL identity (`/categories/<slug>`) and is also what every
 * product references via `Product.category`. Names/spellings are standardised
 * here once (fixing the earlier "Stationary"/"House Hold" inconsistencies).
 *
 * Swap this array for a CMS/admin fetch later and nothing else changes, because
 * all reads go through `lib/categories.ts`.
 */
export const categories: Category[] = [
  {
    id: 'cat-toys',
    slug: 'toys',
    name: 'Toys',
    description:
      'Plush friends, ride-ons, building sets and more — safe, joyful toys that spark imagination at every age.',
    emoji: '🧸',
    color: 'bg-yellow-100',
    displayOrder: 1,
    isFeatured: true,
    offer: { discount: 40, label: 'On Selected Items' },
    seo: {
      metaTitle: 'Toys - Minimagic | Safe & Fun Toys for Kids',
      metaDescription:
        'Shop safe, certified toys for every age at Minimagic — plush toys, racing trucks, dolls, building blocks and more.',
      keywords: ['toys', 'kids toys', 'plush toys', 'teddy bear'],
    },
  },
  {
    id: 'cat-bags',
    slug: 'bags',
    name: 'Bags',
    description: 'Backpacks, totes and lunch bags built for school runs, travel and everyday adventures.',
    emoji: '🎒',
    color: 'bg-orange-100',
    displayOrder: 2,
    isFeatured: true,
    offer: null,
    seo: {
      metaTitle: 'Bags - Minimagic | Backpacks, Totes & More',
      metaDescription: 'Durable, stylish bags for school, travel and everyday use at Minimagic.',
      keywords: ['bags', 'backpacks', 'tote bags'],
    },
  },
  {
    id: 'cat-umbrella',
    slug: 'umbrella',
    name: 'Umbrella',
    description: 'Compact, colourful and sturdy umbrellas to keep the whole family dry in style.',
    emoji: '☂️',
    color: 'bg-blue-100',
    displayOrder: 3,
    isFeatured: true,
    offer: null,
  },
  {
    id: 'cat-stationery',
    slug: 'stationery',
    name: 'Stationery',
    description: 'Notebooks, pens and creative supplies that keep ideas flowing and desks organised.',
    emoji: '✏️',
    color: 'bg-pink-100',
    displayOrder: 4,
    isFeatured: true,
    offer: { discount: 40, label: 'On Selected Items' },
    seo: {
      metaTitle: 'Stationery - Minimagic | Notebooks, Pens & Supplies',
      metaDescription: 'Spark creativity with notebooks, pens and stationery essentials from Minimagic.',
      keywords: ['stationery', 'notebooks', 'pens'],
    },
  },
  {
    id: 'cat-household',
    slug: 'household',
    name: 'Household',
    description: 'Thoughtful home essentials and décor that bring comfort, charm and elegance to your space.',
    emoji: '🏠',
    color: 'bg-orange-50',
    displayOrder: 5,
    isFeatured: true,
    offer: null,
  },
  {
    id: 'cat-fashion-accessories',
    slug: 'fashion-accessories',
    name: 'Fashion Accessories',
    description: 'Scarves, hats and finishing touches that add a little sparkle to every outfit.',
    emoji: '🧣',
    color: 'bg-pink-50',
    displayOrder: 6,
    isFeatured: false,
    offer: null,
  },
  {
    id: 'cat-kitchen-essentials',
    slug: 'kitchen-essentials',
    name: 'Kitchen Essentials',
    description: 'Everyday kitchen tools and lunch gear made for busy families and little helpers.',
    emoji: '🍱',
    color: 'bg-green-50',
    displayOrder: 7,
    isFeatured: false,
    offer: null,
  },
  {
    id: 'cat-hygiene-products',
    slug: 'hygiene-products',
    name: 'Hygiene Products',
    description: 'Gentle, family-safe hygiene essentials to keep little hands clean and healthy.',
    emoji: '🧼',
    color: 'bg-blue-50',
    displayOrder: 8,
    isFeatured: false,
    offer: null,
  },
  {
    id: 'cat-disposable-products',
    slug: 'disposable-products',
    name: 'Disposable Products',
    description: 'Convenient, party-ready disposables for celebrations, picnics and on-the-go days.',
    emoji: '🎉',
    color: 'bg-purple-50',
    displayOrder: 9,
    isFeatured: false,
    offer: null,
  },
]
