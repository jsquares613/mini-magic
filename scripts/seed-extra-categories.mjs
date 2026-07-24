// One-off script: adds the extra category tiles shown in the new Categories
// page design, downloading a representative photo per category from
// LoremFlickr (free, keyword-based, no API key) and uploading it into the
// existing `category-images` Supabase Storage bucket.
//
// Run once with: node scripts/seed-extra-categories.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// [slug, name, emoji, color, keyword-for-photo]
const CATEGORIES = [
  ['soft-toys', 'Soft Toys', '🧸', 'bg-pink-100', 'plush teddy bear'],
  ['remote-toys', 'Remote Toys', '🚙', 'bg-yellow-100', 'rc car toy'],
  ['dolls-accessories', 'Dolls & Accessories', '👧', 'bg-pink-50', 'doll toy'],
  ['building-blocks', 'Building Blocks', '🧱', 'bg-blue-100', 'building blocks toy'],
  ['die-cast-toys', 'Die Cast Toys', '🚗', 'bg-red-100', 'diecast toy car'],
  ['sports-outdoor', 'Sports & Outdoor', '⚽', 'bg-green-100', 'kids sports ball'],
  ['learning-education', 'Learning & Education', '🎓', 'bg-indigo-100', 'kids learning toy'],
  ['puzzles-games', 'Puzzles & Games', '🧩', 'bg-purple-100', 'jigsaw puzzle'],
  ['baby-toys', 'Baby Toys', '🍼', 'bg-orange-100', 'baby rattle toy'],
  ['art-craft', 'Art & Craft', '🎨', 'bg-yellow-50', 'art craft supplies'],
  ['party-supplies', 'Party Supplies', '🎉', 'bg-purple-50', 'party supplies'],
  ['bikes-ride-ons', 'Bikes & Ride Ons', '🚲', 'bg-teal-100', 'kids bicycle'],
  ['musical-toys', 'Musical Toys', '🎵', 'bg-rose-100', 'musical toy xylophone'],
  ['kitchen-playsets', 'Kitchen Playsets', '🍳', 'bg-amber-100', 'toy kitchen playset'],
  ['school-supplies', 'School Supplies', '🎒', 'bg-sky-100', 'school supplies'],
  ['water-bottles', 'Water Bottles', '🍶', 'bg-cyan-100', 'kids water bottle'],
  ['lunch-boxes', 'Lunch Boxes', '🍱', 'bg-lime-100', 'kids lunch box'],
  ['watches', 'Watches', '⌚', 'bg-blue-50', 'wrist watch'],
  ['sunglasses', 'Sunglasses', '🕶️', 'bg-slate-100', 'sunglasses'],
  ['hair-accessories', 'Hair Accessories', '🎀', 'bg-pink-100', 'hair accessories bow'],
  ['jewellery-sets', 'Jewellery Sets', '💍', 'bg-amber-50', 'jewellery set'],
  ['perfumes', 'Perfumes', '🧴', 'bg-fuchsia-100', 'perfume bottle'],
  ['wallets', 'Wallets', '👛', 'bg-orange-50', 'leather wallet'],
  ['belts-accessories', 'Belts & Accessories', '👔', 'bg-stone-100', 'leather belt'],
  ['home-decor', 'Home Decor', '🏡', 'bg-yellow-100', 'home decor'],
  ['storage-organizers', 'Storage & Organizers', '📦', 'bg-blue-100', 'storage organizer box'],
  ['gardening', 'Gardening', '🌱', 'bg-green-50', 'gardening tools'],
  ['pet-supplies', 'Pet Supplies', '🐾', 'bg-orange-100', 'pet supplies'],
  ['seasonal-items', 'Seasonal Items', '🎄', 'bg-red-50', 'seasonal decoration'],
]

async function downloadImage(keyword) {
  const url = `https://loremflickr.com/500/500/${encodeURIComponent(keyword.replace(/\s+/g, ','))}`
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`download failed (${res.status}) for "${keyword}"`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const { data: existing } = await supabase.from('categories').select('display_order').order('display_order', { ascending: false }).limit(1)
  let order = (existing?.[0]?.display_order ?? 9) + 1

  for (const [slug, name, emoji, color, keyword] of CATEGORIES) {
    process.stdout.write(`${slug}: downloading photo for "${keyword}"... `)
    let publicUrl = null
    try {
      const bytes = await downloadImage(keyword)
      const path = `${slug}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
      if (uploadError) throw uploadError
      publicUrl = supabase.storage.from('category-images').getPublicUrl(path).data.publicUrl
      console.log('uploaded')
    } catch (err) {
      console.log(`skipped image (${err.message}), will fall back to emoji`)
    }

    const { error } = await supabase
      .from('categories')
      .upsert(
        {
          slug,
          name,
          emoji,
          color,
          image: publicUrl,
          featured: false,
          display_order: order,
        },
        { onConflict: 'slug' }
      )
    if (error) console.error(`  DB error for ${slug}:`, error.message)
    order += 1
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
