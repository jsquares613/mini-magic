import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { isVideo } from '@/lib/media'
import { getNewArrivalDays } from '@/lib/settings'
import { NEW_ARRIVALS_RAIL_SIZE, NEW_ARRIVAL_MAX_DAYS, newArrivalState } from '@/lib/newArrivals'
import { productFilterConditions, productListHref, toLogicTree } from '@/lib/admin/productFilters'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import AdminImage from '@/components/admin/AdminImage'
import ProductPicker from '@/components/admin/ProductPicker'
import { Badge, Card, EmptyState, Page, PageHeader, buttonClass, iconButtonClass, ui } from '@/components/admin/ui'
import {
  ArrowRightIcon,
  CalendarIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  ImagesIcon,
  MegaphoneIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
  VideoIcon,
} from '@/components/admin/icons'
import {
  deleteHeroSlide,
  addFeaturedProduct,
  removeFeaturedProduct,
  deleteBanner,
  toggleBanner,
  updateNewArrivalDays,
} from './actions'

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })

function MediaThumb({ url }: { url: string | null }) {
  const box = 'flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-400'
  if (!url) return <span className={box}><ImagesIcon className="h-5 w-5" /></span>
  if (isVideo(url)) return <span className={box}><VideoIcon className="h-5 w-5" /></span>
  return (
    <span className={box}>
      <AdminImage src={url} width={80} className="h-full w-full object-cover" />
    </span>
  )
}

export default async function HomepageAdminPage() {
  const supabase = createServerSupabase()
  const newStockTree = toLogicTree(productFilterConditions({ issue: 'new-stock' })) ?? ''
  const [{ data: heroSlides }, { data: banners }, { data: featured }, { data: arrivals }, { count: newStock }, newArrivalDays] = await Promise.all([
    supabase.from('homepage_hero_slides').select('*').order('display_order', { ascending: true }),
    supabase.from('promotional_banners').select('*').order('display_order', { ascending: true }),
    supabase.from('homepage_featured_products').select('id, product_id, sort_order').order('sort_order', { ascending: true }),
    // Exactly what the homepage rail shows (lib/supabase/repositories/products.ts → getNewProducts).
    supabase
      .from('products')
      .select('id, name, new_since, arrived_at')
      .eq('is_published', true)
      .not('arrived_at', 'is', null)
      .order('arrived_at', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(NEW_ARRIVALS_RAIL_SIZE),
    supabase.from('products').select('id', { count: 'exact', head: true }).or(newStockTree),
    getNewArrivalDays(),
  ])

  // Names for the featured products only — the picker searches the catalogue on demand.
  const featuredIds = (featured ?? []).map((f) => f.product_id)
  const { data: featuredProducts } = featuredIds.length
    ? await supabase.from('products').select('id, name, is_published').in('id', featuredIds)
    : { data: [] as { id: string; name: string; is_published: boolean }[] }
  const productById = new Map((featuredProducts ?? []).map((p) => [p.id, p]))

  return (
    <Page className="space-y-6">
      <PageHeader
        title="Homepage"
        description="The hero carousel, hand-picked products, promotional banners and New Arrivals on the home page."
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
                <Link prefetch={false} href={`/admin/homepage/hero/${s.id}`} className={iconButtonClass()} title="Edit">
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
              <ProductPicker
                name="product_id"
                required
                aria-label="Product to feature"
                placeholder="Search published products…"
                className="min-w-0 flex-1"
                excludeIds={featuredIds}
              />
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
                    {productById.get(f.product_id)?.name ?? 'Deleted product'}
                  </span>
                  {productById.get(f.product_id)?.is_published === false && <Badge tone="gray">Not published</Badge>}
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
                  <Link prefetch={false} href={`/admin/homepage/banners/${b.id}`} className={iconButtonClass()} title="Edit">
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

      {/* New Arrivals — automatic; this shows what the rail holds and sets how long "new" lasts */}
      <Card
        title="New Arrivals"
        description={`Automatic: new stock appears once it’s published, newest first, and the homepage row scrolls through all of them (loading more as customers swipe). The ${NEW_ARRIVALS_RAIL_SIZE} newest are listed here.`}
        icon={SparklesIcon}
        tone="teal"
        bodyClassName="p-0"
        actions={
          <a href="/new-arrivals" target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm')}>
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            View page
          </a>
        }
        footer={
          <ActionForm action={updateNewArrivalDays} successMessage="New Arrivals setting saved" className="flex flex-wrap items-center gap-2 py-1 text-sm text-slate-600">
            <label htmlFor="new_arrival_days">Count products as new for</label>
            <input
              id="new_arrival_days"
              name="days"
              type="number"
              inputMode="numeric"
              min={1}
              max={NEW_ARRIVAL_MAX_DAYS}
              required
              defaultValue={newArrivalDays}
              className={`${ui.control} h-9 w-20 text-center`}
            />
            <span>days</span>
            <SubmitButton pendingText="Saving…" variant="secondary">
              Save
            </SubmitButton>
          </ActionForm>
        }
      >
        {(newStock ?? 0) > 0 && (
          <Link
            href={productListHref({ issue: 'new-stock' })}
            className="flex items-center gap-2 border-b border-slate-100 bg-blue-50/60 px-6 py-3 text-sm text-blue-900 transition hover:bg-blue-50"
          >
            <SparklesIcon className="h-4 w-4 shrink-0 text-blue-600" />
            <span className="min-w-0 flex-1">
              <span className="font-semibold tabular-nums">{(newStock ?? 0).toLocaleString('en-IN')}</span> new{' '}
              {newStock === 1 ? 'product is' : 'products are'} waiting to be published — they join New Arrivals once they are.
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0" />
          </Link>
        )}
        {arrivals && arrivals.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {arrivals.map((p, i) => {
              const s = newArrivalState(p, newArrivalDays)
              return (
                <li key={p.id} className={ui.row}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                    {i + 1}
                  </span>
                  <Link
                    prefetch={false}
                    href={`/admin/products/${p.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 hover:text-blue-700 hover:underline"
                  >
                    {p.name}
                  </Link>
                  {s.state === 'new' ? (
                    <Badge tone="teal">New until {shortDate(s.until.toISOString())}</Badge>
                  ) : (
                    <Badge tone="gray">Older than {newArrivalDays} days</Badge>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState
            icon={SparklesIcon}
            title="No new arrivals yet"
            description="Publish new stock from Marg, or mark products as new from the Products list."
          />
        )}
      </Card>
    </Page>
  )
}
