import type { HeroSlide, HeroHighlight } from '@/components/Hero'

const HERO_IMAGES = {
  one: '/images/hero section/hero1.svg',
  two: '/images/hero section/hero2.svg',
  three: '/images/hero section/hero3.svg',
} as const

const PLAY_AREA_IMAGES = {
  one: '/images/play area/play-area-1.png',
  two: '/images/play area/play-area-2.png',
  three: '/images/play area/play-area-3.png',
} as const

/** Shared trust badges used across the storefront hero. */
const STORE_HIGHLIGHTS: HeroHighlight[] = [
  { icon: '✓', label: '100% Safe Toys' },
  { icon: '⭐', label: 'Premium Quality' },
  { icon: '✓', label: 'Kids Approved' },
]

const PLAY_AREA_HIGHLIGHTS: HeroHighlight[] = [
  { icon: '🛡️', label: 'Supervised & Safe' },
  { icon: '🧼', label: 'Sanitised Daily' },
  { icon: '🎉', label: 'Parties Welcome' },
]

const ABOUT_HIGHLIGHTS: HeroHighlight[] = [
  { icon: '💛', label: 'Family Owned' },
  { icon: '⭐', label: 'Trusted Quality' },
  { icon: '🚚', label: 'Pan-India Reach' },
]

/* ------------------------------------------------------------------ */
/* Homepage                                                            */
/* ------------------------------------------------------------------ */
export const homeHeroSlides: HeroSlide[] = [
  {
    id: 'home-joy',
    image: HERO_IMAGES.one,
    imageAlt: 'Colourful toys that inspire imagination',
    title: [
      { text: 'Find', className: 'text-blue-900' },
      { text: ' Joy', className: 'text-red-500' },
      { text: ' in', className: 'text-blue-900', break: true },
      { text: 'Every', className: 'text-yellow-600' },
      { text: ' Toy', className: 'text-green-600' },
    ],
    description: [
      { text: 'Discover toys that inspire imagination, encourage learning & create beautiful memories.' },
    ],
    ctaLabel: 'Explore Categories',
    ctaHref: '/categories',
    highlights: STORE_HIGHLIGHTS,
  },
  {
    id: 'home-space',
    image: HERO_IMAGES.two,
    imageAlt: 'Aesthetic essentials to style your space',
    title: [
      { text: 'Style', className: 'text-blue-900' },
      { text: ' Your', className: 'text-red-500', break: true },
      { text: 'Space', className: 'text-yellow-600' },
      { text: ' Beautifully', className: 'text-green-600' },
    ],
    description: [
      { text: 'Discover', className: 'text-blue-900' },
      { text: ' aesthetic & functional ', break: true },
      { text: 'essentials that bring ' },
      { text: 'comfort', className: 'text-yellow-600' },
      { text: ', ', break: true },
      { text: 'charm & ' },
      { text: 'elegance', className: 'text-green-600' },
      { text: ' to your home.' },
    ],
    ctaLabel: 'Explore Categories',
    ctaHref: '/categories',
    highlights: STORE_HIGHLIGHTS,
  },
  {
    id: 'home-ideas',
    image: HERO_IMAGES.three,
    imageAlt: 'Stationery essentials that spark creativity',
    title: [
      { text: 'Ideas', className: 'text-blue-900' },
      { text: ' Start', className: 'text-red-500', break: true },
      { text: 'Here', className: 'text-yellow-600' },
      { text: ' Every Day', className: 'text-green-600' },
    ],
    description: [
      { text: 'Explore', className: 'text-blue-900' },
      { text: ' a wide range of ' },
      { text: 'stationery', className: 'text-green-600', break: true },
      { text: 'essentials designed to spark creativity', break: true },
      { text: 'and keep you organised.' },
    ],
    ctaLabel: 'Explore Categories',
    ctaHref: '/categories',
    highlights: STORE_HIGHLIGHTS,
  },
]

/* ------------------------------------------------------------------ */
/* Play Area                                                          */
/* ------------------------------------------------------------------ */
export const playAreaHeroSlides: HeroSlide[] = [
  {
    id: 'play-adventure',
    image: PLAY_AREA_IMAGES.one,
    imageAlt: 'Children enjoying the ball pit and slides at Minimagic Play Area',
    badge: '🎠 Minimagic Play Area',
    title: [
      { text: 'Where', className: 'text-blue-900' },
      { text: ' Play', className: 'text-red-500', break: true },
      { text: 'Meets', className: 'text-yellow-600' },
      { text: ' Magic', className: 'text-green-600' },
    ],
    description: [
      { text: 'A safe, colourful indoor playground where little ones climb, slide and imagine to their heart’s content.' },
    ],
    ctaLabel: 'Explore Play Zones',
    ctaHref: '#play-zones',
    highlights: PLAY_AREA_HIGHLIGHTS,
  },
  {
    id: 'play-parties',
    image: PLAY_AREA_IMAGES.two,
    imageAlt: 'A cosy indoor play room with ball pit and slide at Minimagic',
    badge: '🎈 Celebrate With Us',
    title: [
      { text: 'Unforgettable', className: 'text-blue-900', break: true },
      { text: 'Birthday', className: 'text-yellow-600' },
      { text: ' Parties', className: 'text-green-600' },
    ],
    description: [
      { text: 'Book a ' },
      { text: 'private party zone', className: 'text-blue-900' },
      { text: ' with games, treats & ', break: true },
      { text: 'memories', className: 'text-yellow-600' },
      { text: ' your child will never forget.' },
    ],
    ctaLabel: 'Plan a Party',
    ctaHref: '#plan-visit',
    highlights: PLAY_AREA_HIGHLIGHTS,
  },
  {
    id: 'play-learn',
    image: PLAY_AREA_IMAGES.three,
    imageAlt: 'Kids doing arts, building blocks and climbing at the space-themed play zone',
    badge: '🧩 Learn Through Play',
    title: [
      { text: 'Learning', className: 'text-blue-900' },
      { text: ' That', className: 'text-red-500', break: true },
      { text: 'Feels', className: 'text-yellow-600' },
      { text: ' Like Fun', className: 'text-green-600' },
    ],
    description: [
      { text: 'From ' },
      { text: 'building blocks', className: 'text-green-600' },
      { text: ' to ', break: true },
      { text: 'arts & crafts', className: 'text-yellow-600' },
      { text: ', every corner sparks curiosity and growth.' },
    ],
    ctaLabel: 'Plan Your Visit',
    ctaHref: '#plan-visit',
    highlights: PLAY_AREA_HIGHLIGHTS,
  },
]

/* ------------------------------------------------------------------ */
/* About Us                                                           */
/* ------------------------------------------------------------------ */
export const aboutHeroSlides: HeroSlide[] = [
  {
    id: 'about-story',
    image: HERO_IMAGES.two,
    imageAlt: 'The Minimagic team and storefront',
    badge: '✨ Our Story',
    title: [
      { text: 'Making', className: 'text-blue-900' },
      { text: ' Everyday', className: 'text-red-500', break: true },
      { text: 'Moments', className: 'text-yellow-600' },
      { text: ' Magical', className: 'text-green-600' },
    ],
    description: [
      { text: 'We are a family of toy lovers on a mission to bring ' },
      { text: 'joy, learning & wonder', className: 'text-blue-900' },
      { text: ' to every home.' },
    ],
    ctaLabel: 'Discover Our Story',
    ctaHref: '#our-story',
    highlights: ABOUT_HIGHLIGHTS,
  },
  {
    id: 'about-mission',
    image: HERO_IMAGES.one,
    imageAlt: 'Quality, safe toys curated by Minimagic',
    badge: '🎯 Our Promise',
    title: [
      { text: 'Quality', className: 'text-blue-900' },
      { text: ' You', className: 'text-red-500', break: true },
      { text: 'Can', className: 'text-yellow-600' },
      { text: ' Trust', className: 'text-green-600' },
    ],
    description: [
      { text: 'Every product is ' },
      { text: 'hand-picked & safety-checked', className: 'text-green-600' },
      { text: ' so you can shop with complete confidence.' },
    ],
    ctaLabel: 'Why Choose Us',
    ctaHref: '#why-choose-us',
    highlights: ABOUT_HIGHLIGHTS,
  },
]
