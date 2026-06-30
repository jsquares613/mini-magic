import type { PlayInfoBlock, PlayZone } from '@/types'

/**
 * Play Area content — the single source for the /play-area page and for the
 * Play Area entries in global search. Previously hardcoded inside the page.
 */

export const playZones: PlayZone[] = [
  { id: 'pz-1', name: 'Ball Pit', image: '/images/play area/play-area-1.png', description: 'Dive into thousands of soft, colourful balls.' },
  { id: 'pz-2', name: 'Slides & Tunnels', image: '/images/play area/play-area-2.png', description: 'Twisting slides and crawl tunnels for endless fun.' },
  { id: 'pz-3', name: 'Climbing Zone', image: '/images/play area/play-area-3.png', description: 'Soft-padded climbing frames that build confidence.' },
  { id: 'pz-4', name: 'Trampoline Park', image: '/images/play area/play-area-1.png', description: 'Bounce away energy on cushioned trampolines.' },
  { id: 'pz-5', name: 'Arts & Crafts', image: '/images/play area/play-area-3.png', description: 'Hands-on creativity with paints, clay and more.' },
  { id: 'pz-6', name: 'Mini Theatre', image: '/images/play area/play-area-2.png', description: 'Story time, puppet shows and dress-up play.' },
]

export const playFeatures = [
  { icon: '🛡️', title: 'Always Supervised', desc: 'Trained, friendly staff watch over every zone so parents can relax.', bgColor: 'bg-green-50' },
  { icon: '🧼', title: 'Sanitised Daily', desc: 'Equipment is cleaned and sanitised throughout the day for hygienic play.', bgColor: 'bg-blue-50' },
  { icon: '👶', title: 'Age-Appropriate', desc: 'Dedicated areas for toddlers and older kids keep play safe and fair.', bgColor: 'bg-yellow-50' },
  { icon: '😊', title: 'Parent Friendly', desc: 'Comfortable seating, Wi-Fi and a café corner while the little ones play.', bgColor: 'bg-purple-50' },
]

export const playVisitInfo: PlayInfoBlock[] = [
  { icon: '🕒', title: 'Opening Hours', lines: ['Mon–Fri: 10am – 8pm', 'Sat–Sun: 9am – 9pm'] },
  { icon: '🎟️', title: 'Entry Passes', lines: ['Kids: ₹299 / hour', 'Adults: Free with child'] },
  { icon: '📍', title: 'Find Us', lines: ['Minimagic Store', 'India'] },
]
