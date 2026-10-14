import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { isVideo } from '@/lib/media'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { Badge, Card, EmptyState, Page, PageHeader, buttonClass, iconButtonClass, ui } from '@/components/admin/ui'
import {
  CalendarIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  ImagesIcon,
  MegaphoneIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  VideoIcon,
} from '@/components/admin/icons'
import { deleteHeroSlide, addFeaturedProduct, removeFeaturedProduct, deleteBanner, toggleBanner } from './actions'

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })

function MediaThumb({ url }: { url: string | null }) {
  const box = 'flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-400'
  if (!url) return <span className={box}><ImagesIcon className="h-5 w-5" /></span>
  if (isVideo(url)) return <span className={box}><VideoIcon className="h-5 w-5" /></span>
  return (
    <span className={box}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
    </span>
  )
}

export default async function HomepageAdminPage() {
  const supabase = createServerSupabase()
  const [{ data: heroSlides }, { data: banners }, { data: featured }, { data: products }] = await Promise.all([
    supabase.from('homepage_hero_slides').select('*').order('display_order', { ascending: true }),
    supabase.from('promotional_banners').select('*').order('display_order', { ascending: true }),
    supabase.from('homepage_featured_products').select('id, product_id, sort_order').order('sort_order', { ascending: true }),
    supabase.from('products').select('id, name').eq('is_published', true).order('name', { ascending: true }),
  ])

  const productName = new Map((products ?? []).map((p) => [p.id, p.name]))
  const featuredIds = new Set((featured ?? []).map((f) => f.product_id))
  const availableToFeature = (products ?? []).filter((p) => !featuredIds.has(p.id))

  return (
    <Page className="space-y-6">
      <PageHeader
        title="Homepage"
        description="The hero carousel, hand-picked products and promotional banners on the home page."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
            <ExternalLinkIcon className="h-4 w-4" />
            View homepage
          </a>
        }
      />

      {/* Hero slides */}
      <Card
        title="Hero slides"
        description="The large carousel at the top. Images or MP4 videos, 1280 × 440 px."
        icon={ImagesIcon}
        tone="violet"
        bodyClassName="p-0"
        actions={
          <Link href="/admin/homepage/hero/new" className={buttonClass('primary', 'sm')}>
            <PlusIcon className="h-3.5 w-3.5" />
            Add slide
          </Link>
        }
      >
        {heroSlides && heroSlides.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {heroSlides.map((s, i) => (
              <li key={s.id} className={ui.row}>
                <MediaThumb url={s.image} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-slate-900">{s.title || `Slide ${i + 1}`}</span>
                    {!s.active && <Badge tone="gray">Hidden</Badge>}
                  </div>
                  {s.subtitle && <p className="truncate text-xs text-slate-500">{s.subtitle}</p>}
                </div>
                <Link href={`/admin/homepage/hero/${s.id}`} className={iconButtonClass()} title="Edit">
                  <PencilIcon className="h-4 w-4" />
                  <span className="sr-only">Edit slide</span>
                </Link>
                <ActionForm action={deleteHeroSlide.bind(null, s.id)} successMessage="Hero slide deleted successfully" confirmMessage="Delete this hero slide?">
                  <SubmitButton pendingText="" variant="icon-danger">
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Delete slide</span>
                  </SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={ImagesIcon} title="No slides yet" description="Add a slide to show a banner at the top of the homepage." />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Featured products */}
        <Card
          title="Featured products"
          description="Hand-picked products shown on the homepage."
          icon={StarIcon}
          tone="amber"
          bodyClassName="p-0"
          footer={
            <ActionForm action={addFeaturedProduct} successMessage="Featured product added" className="flex gap-2 py-1">
              <select name="product_id" required defaultValue="" aria-label="Product" className={`${ui.control} min-w-0 flex-1`}>
                <option value="" disabled>
                  Choose a published product…
                </option>
                {availableToFeature.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <SubmitButton pendingText="Adding…">
                <PlusIcon className="h-4 w-4" />
                Add
              </SubmitButton>
            </ActionForm>
          }
        >
          {featured && featured.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {featured.map((f, i) => (
                <li key={f.id} className={ui.row}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-semibold text-amber-700">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                    {productName.get(f.product_id) ?? 'Unpublished product'}
                  </span>
                  <ActionForm action={removeFeaturedProduct.bind(null, f.id)} successMessage="Featured product removed">
                    <SubmitButton pendingText="" variant="icon-danger">
                      <TrashIcon className="h-4 w-4" />
                      <span className="sr-only">Remove from featured</span>
                    </SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-5 text-sm text-slate-500">No featured products yet.</p>
          )}
        </Card>

        {/* Promotional banners */}
        <Card
          title="Promotional banners"
          description="Offer blocks such as “40% off — Explore”."
          icon={MegaphoneIcon}
          tone="red"
          bodyClassName="p-0"
          actions={
            <Link href="/admin/homepage/banners/new" className={buttonClass('primary', 'sm')}>
              <PlusIcon className="h-3.5 w-3.5" />
              Add banner
            </Link>
          }
        >
          {banners && banners.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {banners.map((b) => (
                <li key={b.id} className={ui.row}>
                  <MediaThumb url={b.image} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-slate-900">{b.title}</span>
                      {b.badge_text && <Badge tone="red">{b.badge_text}</Badge>}
                      {!b.active && <Badge tone="gray">Hidden</Badge>}
                    </div>
                    {(b.starts_at || b.ends_at) && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {b.starts_at ? shortDate(b.starts_at) : 'Now'} → {b.ends_at ? shortDate(b.ends_at) : 'no end'}
                      </p>
                    )}
                  </div>
                  <ActionForm action={toggleBanner.bind(null, b.id, !b.active)} successMessage={b.active ? 'Banner hidden' : 'Banner shown'}>
                    <SubmitButton pendingText="" variant="icon">
                      {b.active ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      <span className="sr-only">{b.active ? 'Hide' : 'Show'} banner</span>
                    </SubmitButton>
                  </ActionForm>
                  <Link href={`/admin/homepage/banners/${b.id}`} className={iconButtonClass()} title="Edit">
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Edit banner</span>
                  </Link>
                  <ActionForm action={deleteBanner.bind(null, b.id)} successMessage="Banner deleted successfully" confirmMessage="Delete this banner?">
                    <SubmitButton pendingText="" variant="icon-danger">
                      <TrashIcon className="h-4 w-4" />
                      <span className="sr-only">Delete banner</span>
                    </SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={MegaphoneIcon} title="No banners yet" description="Add a banner to promote an offer on the homepage." />
          )}
        </Card>
      </div>
    </Page>
  )
}
