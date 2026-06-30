import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import {
  deleteHeroSlide,
  addFeaturedProduct,
  removeFeaturedProduct,
  deleteBanner,
  toggleBanner,
} from './actions'

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'

export default async function HomepageAdminPage() {
  const supabase = createServerSupabase()
  const [{ data: heroSlides }, { data: banners }, { data: featured }, { data: products }] =
    await Promise.all([
      supabase.from('homepage_hero_slides').select('*').order('display_order', { ascending: true }),
      supabase.from('promotional_banners').select('*').order('display_order', { ascending: true }),
      supabase.from('homepage_featured_products').select('id, product_id, sort_order').order('sort_order', { ascending: true }),
      supabase.from('products').select('id, name').order('name', { ascending: true }),
    ])

  const productName = new Map((products ?? []).map((p) => [p.id, p.name]))
  const featuredIds = new Set((featured ?? []).map((f) => f.product_id))
  const availableToFeature = (products ?? []).filter((p) => !featuredIds.has(p.id))

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Homepage</h1>

      {/* Hero slides */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Hero Slides</h2>
          <Link href="/admin/homepage/hero/new" className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800">
            + Add slide
          </Link>
        </div>
        <div className="space-y-2">
          {(heroSlides ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.image && <img src={s.image} alt="" className="h-10 w-16 flex-shrink-0 rounded object-cover" />}
                <div className="min-w-0">
                  <span className="block truncate font-medium text-gray-900">{s.title}</span>
                  {!s.active && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-3">
                <Link href={`/admin/homepage/hero/${s.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                  Edit
                </Link>
                <ActionForm
                  action={deleteHeroSlide.bind(null, s.id)}
                  successMessage="Hero slide deleted successfully"
                  confirmMessage="Delete this hero slide?"
                >
                  <SubmitButton pendingText="Deleting…" variant="link" className="text-sm text-red-600">
                    Delete
                  </SubmitButton>
                </ActionForm>
              </div>
            </div>
          ))}
          {(!heroSlides || heroSlides.length === 0) && <p className="text-sm text-gray-400">No slides yet.</p>}
        </div>
      </section>

      {/* Featured products */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-bold text-gray-900">Featured Products (curated)</h2>
        <div className="mb-4 space-y-2">
          {(featured ?? []).map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2">
              <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{productName.get(f.product_id) ?? f.product_id}</span>
              <ActionForm action={removeFeaturedProduct.bind(null, f.id)} successMessage="Featured product removed">
                <SubmitButton pendingText="Removing…" variant="link" className="text-sm text-red-600">
                  Remove
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
          {(!featured || featured.length === 0) && <p className="text-sm text-gray-400">No featured products yet.</p>}
        </div>
        <ActionForm action={addFeaturedProduct} successMessage="Featured product added" className="flex flex-wrap gap-2">
          <select name="product_id" required className={input}>
            <option value="">Select a product…</option>
            {availableToFeature.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <SubmitButton pendingText="Adding…">Add</SubmitButton>
        </ActionForm>
      </section>

      {/* Promotional banners */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Promotional Banners</h2>
          <Link href="/admin/homepage/banners/new" className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800">
            + Add banner
          </Link>
        </div>
        <div className="space-y-2">
          {(banners ?? []).map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="font-medium text-gray-900">{b.title}</span>{' '}
                {b.badge_text && <span className="text-sm text-red-500">{b.badge_text}</span>}
                {!b.active && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
                {(b.starts_at || b.ends_at) && (
                  <span className="ml-2 text-xs text-blue-500">
                    🕒 {b.starts_at ? new Date(b.starts_at).toLocaleDateString() : 'now'}
                    {' → '}
                    {b.ends_at ? new Date(b.ends_at).toLocaleDateString() : 'no end'}
                  </span>
                )}
              </div>
              <div className="flex flex-shrink-0 gap-3">
                <ActionForm
                  action={toggleBanner.bind(null, b.id, !b.active)}
                  successMessage={b.active ? 'Banner disabled' : 'Banner enabled'}
                >
                  <SubmitButton pendingText="Working…" variant="link" className="text-sm text-blue-600">
                    {b.active ? 'Disable' : 'Enable'}
                  </SubmitButton>
                </ActionForm>
                <Link href={`/admin/homepage/banners/${b.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                  Edit
                </Link>
                <ActionForm
                  action={deleteBanner.bind(null, b.id)}
                  successMessage="Banner deleted successfully"
                  confirmMessage="Delete this banner?"
                >
                  <SubmitButton pendingText="Deleting…" variant="link" className="text-sm text-red-600">
                    Delete
                  </SubmitButton>
                </ActionForm>
              </div>
            </div>
          ))}
          {(!banners || banners.length === 0) && <p className="text-sm text-gray-400">No banners yet.</p>}
        </div>
      </section>
    </div>
  )
}
