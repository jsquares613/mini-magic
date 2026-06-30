/**
 * Seed script — populates Supabase from the existing in-project data so the
 * database matches the current storefront exactly.
 *
 * Sources: data/products.ts, data/categories.ts, data/playArea.ts, lib/hero.ts,
 * config/site.ts (single source of truth — no data is re-typed here).
 *
 * Run (after creating .env.local with NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY and applying the migrations):
 *
 *   npx tsx scripts/seed.ts
 *
 * It is RE-RUNNABLE: it clears the relevant tables first, then re-inserts.
 * Uses the service-role client (bypasses RLS). Never ship this to the browser.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Minimal .env loader so the script is self-contained (no dotenv dependency).
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(process.cwd(), file)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}
loadEnv()

import { getServiceClient } from '../lib/supabase/client'
import { products as PRODUCTS } from '../data/products'
import { categories as CATEGORIES } from '../data/categories'
import { playZones, playFeatures } from '../data/playArea'
import { homeHeroSlides, playAreaHeroSlides } from '../lib/hero'
import { siteConfig } from '../config/site'

const sb = getServiceClient()

/* --------------------------------- helpers -------------------------------- */

type Seg = { text: string }
const flatten = (segs: Seg[]) => segs.map((s) => s.text).join('').replace(/\s+/g, ' ').trim()

const AGE_GROUPS = [
  { slug: '0-1', label: '0–1 years', min_age: 0, max_age: 1, sort_order: 1 },
  { slug: '1-3', label: '1–3 years', min_age: 1, max_age: 3, sort_order: 2 },
  { slug: '3-5', label: '3–5 years', min_age: 3, max_age: 5, sort_order: 3 },
  { slug: '5-8', label: '5–8 years', min_age: 5, max_age: 8, sort_order: 4 },
  { slug: '8-12', label: '8–12 years', min_age: 8, max_age: 12, sort_order: 5 },
  { slug: '12-plus', label: '12+ years', min_age: 12, max_age: null, sort_order: 6 },
  { slug: 'all-ages', label: 'All ages', min_age: null, max_age: null, sort_order: 7 },
]

/** Map a free-text age group (e.g. "3+ years", "Adult", "All ages") to slugs. */
function ageSlugsFor(raw: string): string[] {
  const v = raw.toLowerCase()
  if (v.includes('all ages')) return ['all-ages']
  if (v.includes('adult')) return ['12-plus']
  const m = v.match(/(\d+)\s*\+/)
  if (m) {
    const n = Number(m[1])
    const slugs = AGE_GROUPS.filter((g) => g.slug !== 'all-ages' && (g.max_age === null || g.max_age > n)).map((g) => g.slug)
    return slugs.length ? slugs : ['all-ages']
  }
  return ['all-ages']
}

async function clearAll() {
  // reverse FK order; profiles untouched (tied to auth.users)
  const uuidTables = [
    'enquiry_notes', 'enquiries', 'audit_log', 'product_related', 'product_images',
    'category_promotions', 'homepage_featured_products', 'products', 'age_groups',
    'categories', 'homepage_hero_slides', 'promotional_banners',
    'play_area_gallery', 'play_area_features', 'about_statistics',
    'team_members', 'testimonials', 'business_hours', 'navigation_links', 'social_links',
    'seo_pages', 'redirects',
  ] as const
  await sb.from('product_age_groups').delete().not('product_id', 'is', null)
  for (const t of uuidTables) await sb.from(t).delete().not('id', 'is', null)
  await sb.from('site_settings').delete().not('key', 'is', null)
  await sb.from('play_area').delete().eq('id', 1)
  await sb.from('about_page').delete().eq('id', 1)
  await sb.from('contact_information').delete().eq('id', 1)
}

function die(label: string, error: { message: string } | null) {
  if (error) {
    console.error(`✖ ${label}: ${error.message}`)
    process.exit(1)
  }
}

/* ---------------------------------- seed ---------------------------------- */

async function main() {
  console.log('Seeding Mini Magic database…')
  await clearAll()

  // Age groups
  {
    const { error } = await sb.from('age_groups').insert(AGE_GROUPS)
    die('age_groups', error)
  }

  // Categories
  const { data: catRows, error: catErr } = await sb
    .from('categories')
    .insert(
      CATEGORIES.map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        emoji: c.emoji,
        color: c.color,
        featured: c.isFeatured,
        display_order: c.displayOrder,
        seo_title: c.seo?.metaTitle ?? null,
        seo_description: c.seo?.metaDescription ?? null,
      })),
    )
    .select('id, slug')
  die('categories', catErr)
  const catId = new Map((catRows ?? []).map((r) => [r.slug, r.id]))

  // Products
  const { data: prodRows, error: prodErr } = await sb
    .from('products')
    .insert(
      PRODUCTS.map((p) => ({
        name: p.name,
        slug: p.slug,
        short_description: p.shortDescription,
        description: p.description,
        category_id: catId.get(p.category)!,
        price: p.price,
        sale_price: p.salePrice,
        price_display: 'show' as const,
        material: p.material,
        color: p.color,
        available: p.stockStatus !== 'out-of-stock',
        tags: p.tags,
        features: p.features,
        popular: p.isPopular,
        new_arrival: p.isNew,
        display_order: p.displayOrder,
        seo_title: p.seo?.metaTitle ?? null,
        seo_description: p.seo?.metaDescription ?? null,
      })),
    )
    .select('id, slug')
  die('products', prodErr)
  const prodId = new Map((prodRows ?? []).map((r) => [r.slug, r.id]))

  // Product ↔ age groups
  {
    const rows = PRODUCTS.flatMap((p) =>
      ageSlugsFor(p.ageGroup).map((slug) => ({
        product_id: prodId.get(p.slug)!,
        age_group_id: '', // filled below
        _ageSlug: slug,
      })),
    )
    // resolve age slugs → ids
    const { data: ageRows } = await sb.from('age_groups').select('id, slug')
    const ageId = new Map((ageRows ?? []).map((r) => [r.slug, r.id]))
    const finalRows = rows.map((r) => ({ product_id: r.product_id, age_group_id: ageId.get(r._ageSlug)! }))
    const { error } = await sb.from('product_age_groups').insert(finalRows)
    die('product_age_groups', error)
  }

  // Related products (curated)
  {
    const rows = PRODUCTS.flatMap((p) =>
      p.relatedProducts
        .filter((rel) => prodId.has(rel))
        .map((rel, i) => ({
          product_id: prodId.get(p.slug)!,
          related_product_id: prodId.get(rel)!,
          sort_order: i,
        })),
    )
    const { error } = await sb.from('product_related').insert(rows)
    die('product_related', error)
  }

  // Category promotions (banners) + homepage promotional banners, from category offers
  {
    const promoCats = CATEGORIES.filter((c) => c.offer)
    const { error } = await sb.from('category_promotions').insert(
      promoCats.map((c, i) => ({
        category_id: catId.get(c.slug)!,
        title: `${c.name} Sale`,
        badge_text: `${c.offer!.discount}% Off`,
        description: c.offer!.label,
        link: `/categories/${c.slug}`,
        display_order: i,
      })),
    )
    die('category_promotions', error)

    const { error: bannerErr } = await sb.from('promotional_banners').insert(
      promoCats.map((c, i) => ({
        title: c.name,
        subtitle: c.offer!.label,
        badge_text: `${c.offer!.discount}% Off`,
        link: `/categories/${c.slug}`,
        display_order: i,
      })),
    )
    die('promotional_banners', bannerErr)
  }

  // Homepage hero slides (flattened from rich-text hero data)
  {
    const { error } = await sb.from('homepage_hero_slides').insert(
      homeHeroSlides.map((s, i) => ({
        title: flatten(s.title),
        subtitle: s.badge ?? null,
        description: flatten(s.description),
        image: s.image,
        button_text: s.ctaLabel ?? null,
        button_link: s.ctaHref ?? null,
        display_order: i,
      })),
    )
    die('homepage_hero_slides', error)
  }

  // Homepage featured products (curated from the original isFeatured flag)
  {
    const featured = PRODUCTS.filter((p) => p.isFeatured)
    const { error } = await sb
      .from('homepage_featured_products')
      .insert(featured.map((p, i) => ({ product_id: prodId.get(p.slug)!, sort_order: i })))
    die('homepage_featured_products', error)
  }

  // Play area (singleton) + gallery + features
  {
    const hero = playAreaHeroSlides[0]
    const { error } = await sb.from('play_area').insert({
      id: 1,
      hero_image: hero?.image ?? null,
      hero_title: hero ? flatten(hero.title) : null,
      hero_description: hero ? flatten(hero.description) : null,
      timings: [
        { label: 'Mon–Fri', value: '10am – 8pm' },
        { label: 'Sat–Sun', value: '9am – 9pm' },
      ],
      pricing: [
        { label: 'Kids', value: '₹299 / hour' },
        { label: 'Adults', value: 'Free with child' },
      ],
      rules: ['Socks mandatory', 'Adult supervision required', 'No outside food'],
    })
    die('play_area', error)

    die('play_area_gallery', (await sb.from('play_area_gallery').insert(
      playZones.map((z, i) => ({ image_url: z.image, alt_text: z.name, sort_order: i })),
    )).error)

    die('play_area_features', (await sb.from('play_area_features').insert(
      playFeatures.map((f, i) => ({ icon: f.icon, title: f.title, description: f.desc, sort_order: i })),
    )).error)
  }

  // About page + statistics + team + testimonials
  {
    die('about_page', (await sb.from('about_page').insert({
      id: 1,
      story:
        'Minimagic began with a simple belief: the right toy at the right moment can spark a lifetime of imagination. What started as a tiny neighbourhood store has grown into a destination families trust.',
      mission: 'To make joyful, safe and enriching products accessible to every family.',
      vision: 'To become the most loved family destination where play, learning and everyday essentials come together.',
      values_text: 'Safety first, honest pricing, genuine care and a focus on children’s smiles.',
    })).error)

    die('about_statistics', (await sb.from('about_statistics').insert([
      { label: 'Happy Families', value: 50000, suffix: '+', sort_order: 1 },
      { label: 'Products Curated', value: 1200, suffix: '+', sort_order: 2 },
      { label: 'Categories', value: 9, suffix: '+', sort_order: 3 },
      { label: 'Average Rating', value: 4.9, suffix: '★', sort_order: 4 },
    ])).error)

    die('team_members', (await sb.from('team_members').insert([
      { name: 'Aarav Mehta', designation: 'Founder & CEO', display_order: 1 },
      { name: 'Priya Sharma', designation: 'Head of Curation', display_order: 2 },
      { name: 'Rahul Verma', designation: 'Operations Lead', display_order: 3 },
      { name: 'Sneha Iyer', designation: 'Customer Happiness', display_order: 4 },
    ])).error)

    die('testimonials', (await sb.from('testimonials').insert([
      { author_name: 'Neha R.', author_role: 'Parent of two', quote: 'My kids love the play area and the toys are great quality. The staff are so helpful!', rating: 5, display_order: 1 },
      { author_name: 'Arjun K.', author_role: 'Dad', quote: 'Booked a birthday party here — fantastic experience, stress-free and the kids had a blast.', rating: 5, display_order: 2 },
      { author_name: 'Meera S.', author_role: 'Mother', quote: 'Great prices and a lovely range of stationery and gifts. Our go-to store now.', rating: 5, display_order: 3 },
    ])).error)
  }

  // Contact + business hours
  {
    die('contact_information', (await sb.from('contact_information').insert({
      id: 1,
      phone: siteConfig.contact.phone,
      whatsapp: siteConfig.contact.whatsapp,
      email: siteConfig.contact.email,
      address: siteConfig.contact.location,
    })).error)

    const hours = [
      { day_of_week: 0, opens_at: '11:00', closes_at: '19:00' }, // Sun
      { day_of_week: 1, opens_at: '10:00', closes_at: '20:00' },
      { day_of_week: 2, opens_at: '10:00', closes_at: '20:00' },
      { day_of_week: 3, opens_at: '10:00', closes_at: '20:00' },
      { day_of_week: 4, opens_at: '10:00', closes_at: '20:00' },
      { day_of_week: 5, opens_at: '10:00', closes_at: '21:00' },
      { day_of_week: 6, opens_at: '09:00', closes_at: '21:00' }, // Sat
    ]
    die('business_hours', (await sb.from('business_hours').insert(hours)).error)
  }

  // Navigation + socials + settings + seo
  {
    const nav = [
      ...siteConfig.mainNav.map((l, i) => ({ label: l.label, url: l.href, location: 'header' as const, display_order: i })),
      ...siteConfig.quickLinks.map((l, i) => ({ label: l.label, url: l.href, location: 'footer_quick' as const, display_order: i })),
      ...CATEGORIES.map((c, i) => ({ label: c.name, url: `/categories/${c.slug}`, location: 'footer_category' as const, display_order: i })),
    ]
    die('navigation_links', (await sb.from('navigation_links').insert(nav)).error)

    die('social_links', (await sb.from('social_links').insert(
      siteConfig.socials.map((s, i) => ({ platform: s.label.toLowerCase(), url: s.href, icon: s.iconPath, sort_order: i })),
    )).error)

    die('site_settings', (await sb.from('site_settings').insert([
      { key: 'announcements', value: [...siteConfig.announcements] },
      { key: 'footer_text', value: siteConfig.tagline },
      { key: 'brand', value: { name: siteConfig.name, wordmark: siteConfig.wordmark } },
      { key: 'default_price_display', value: 'show' },
    ])).error)

    die('seo_pages', (await sb.from('seo_pages').insert([
      { page_key: 'home', meta_title: `${siteConfig.name} - Find Joy in Every Toy`, meta_description: siteConfig.description },
      { page_key: 'offers', meta_title: 'Special Offers - Minimagic', meta_description: 'Deals and discounts on toys and essentials.' },
      { page_key: 'play-area', meta_title: 'Play Area - Minimagic', meta_description: 'A safe, supervised indoor playground for kids.' },
      { page_key: 'about', meta_title: 'About Us - Minimagic', meta_description: 'Our story, mission and team.' },
      { page_key: 'contact', meta_title: 'Contact Us - Minimagic', meta_description: 'Get in touch with the Minimagic team.' },
    ])).error)
  }

  console.log('✅ Seed complete.')
  console.log(`   ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${AGE_GROUPS.length} age groups seeded.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
