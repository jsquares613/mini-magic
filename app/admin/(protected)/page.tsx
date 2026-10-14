import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { timeAgo } from '@/lib/format'
import { productFilterConditions, productListHref, toLogicTree, type ProductListFilters } from '@/lib/admin/productFilters'
import { ENQUIRY_STATUS, ENQUIRY_STATUS_ORDER, ENQUIRY_TYPE } from '@/lib/admin/enquiryLabels'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { Avatar, Badge, Card, EmptyState, Page, ProgressBar, StatCard, buttonClass, ui, type Tone } from '@/components/admin/ui'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ImageIcon,
  InboxIcon,
  PackageIcon,
  PlusIcon,
  RefreshIcon,
  TrendingUpIcon,
} from '@/components/admin/icons'
import type { Enums } from '@/lib/supabase/database.types'
import { syncMargNow } from './marg/actions'

const PIPELINE_COLOUR: Record<Enums<'enquiry_status'>, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-amber-400',
  in_progress: 'bg-violet-500',
  converted: 'bg-emerald-500',
  lost: 'bg-slate-300',
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-IN')} ${n === 1 ? one : many}`

export default async function DashboardPage() {
  const supabase = createServerSupabase()

  /** Product counts use the same filters as the Products page tabs, so the numbers match the lists they link to. */
  const countProducts = async (f: Partial<ProductListFilters>, extra: string[] = []) => {
    let q = supabase.from('products').select('id', { count: 'exact', head: true })
    const tree = toLogicTree(productFilterConditions(f, extra))
    if (tree) q = q.or(tree)
    const { count } = await q
    return count ?? 0
  }

  const [
    profile,
    live,
    drafts,
    ready,
    missingPhoto,
    margTotal,
    margPublished,
    margWithPhoto,
    margCategorised,
    margInStock,
    { data: statuses },
    { data: recent },
    { data: lastRun },
    { data: lastSuccess },
  ] = await Promise.all([
    getCurrentProfile(),
    countProducts({ view: 'published' }),
    countProducts({ view: 'draft' }),
    countProducts({ issue: 'ready' }),
    countProducts({ issue: 'missing-photo' }),
    countProducts({ source: 'marg' }),
    countProducts({ view: 'published', source: 'marg' }),
    countProducts({ source: 'marg' }, ['image_count.gt.0']),
    countProducts({ source: 'marg' }, ['category_id.not.is.null']),
    countProducts({ source: 'marg' }, ['marg_stock.gt.0']),
    supabase.from('enquiries').select('status'),
    supabase
      .from('enquiries')
      .select('id, name, enquiry_type, status, subject, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('marg_sync_runs').select('kind, status, error, started_at').order('started_at', { ascending: false }).limit(1).maybeSingle(),
    supabase
      .from('marg_sync_runs')
      .select('started_at, finished_at')
      .eq('status', 'success')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const statusCounts = Object.fromEntries(ENQUIRY_STATUS_ORDER.map((s) => [s, 0])) as Record<Enums<'enquiry_status'>, number>
  for (const e of statuses ?? []) statusCounts[e.status] += 1
  const totalEnquiries = statuses?.length ?? 0
  const newLeads = statusCounts.new

  // Greeting in shop time (IST), whatever the server's clock zone.
  const now = new Date()
  const hour = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(now))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }).format(now)
  const handle = profile?.email?.split('@')[0] ?? ''
  const name = handle ? handle.charAt(0).toUpperCase() + handle.slice(1) : 'there'

  const todo = [
    ready > 0 && `${plural(ready, 'product')} ready to publish`,
    newLeads > 0 && `${plural(newLeads, 'new lead')} to follow up`,
  ].filter(Boolean)
  const summary = todo.length ? `You have ${todo.join(' and ')}.` : 'Everything is up to date.'

  const syncStatus: { label: string; tone: Tone } = !lastRun
    ? { label: 'Never synced', tone: 'gray' }
    : lastRun.status === 'failed'
      ? { label: 'Last sync failed', tone: 'red' }
      : lastRun.status === 'running'
        ? { label: 'Syncing…', tone: 'blue' }
        : { label: 'Up to date', tone: 'green' }
  const isAdmin = profile?.role === 'admin'

  const health: { label: string; value: number; tone: Tone }[] = [
    { label: 'Published', value: margPublished, tone: 'blue' },
    { label: 'Have photos', value: margWithPhoto, tone: 'violet' },
    { label: 'Categorised', value: margCategorised, tone: 'teal' },
    { label: 'In stock', value: margInStock, tone: 'green' },
  ]

  return (
    <Page className="space-y-6">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 p-6 text-white shadow-lg shadow-blue-950/10 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-blue-200">{today}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting}, {name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-blue-100/90">{summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={productListHref({ issue: 'ready' })}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-blue-900 shadow-sm transition hover:bg-blue-50"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Review drafts
            </Link>
            <Link
              href="/admin/products/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/15"
            >
              <PlusIcon className="h-4 w-4" />
              New product
            </Link>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Live products"
          value={live}
          icon={PackageIcon}
          tone="blue"
          href={productListHref({ view: 'published' })}
          hint={`${plural(drafts, 'draft')} waiting for review`}
        />
        <StatCard
          label="Ready to publish"
          value={ready}
          icon={CheckCircleIcon}
          tone="teal"
          href={productListHref({ issue: 'ready' })}
          hint="Photo and category added"
        />
        <StatCard
          label="Missing photos"
          value={missingPhoto}
          icon={ImageIcon}
          tone="amber"
          href={productListHref({ issue: 'missing-photo' })}
          hint="A photo is needed to publish"
        />
        <StatCard
          label="New leads"
          value={newLeads}
          icon={InboxIcon}
          tone="violet"
          href="/admin/enquiries?status=new"
          hint={`${plural(totalEnquiries, 'enquiry', 'enquiries')} in total`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent enquiries + pipeline */}
        <Card
          className="lg:col-span-2"
          title="Recent enquiries"
          description="Latest leads from the website and WhatsApp"
          icon={InboxIcon}
          tone="violet"
          bodyClassName="p-0"
          actions={
            <Link href="/admin/enquiries" className={buttonClass('ghost', 'sm')}>
              View all
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
          footer={
            totalEnquiries > 0 && (
              <div className="py-1">
                <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                  {ENQUIRY_STATUS_ORDER.map((s) =>
                    statusCounts[s] > 0 ? (
                      <div key={s} className={PIPELINE_COLOUR[s]} style={{ width: `${(statusCounts[s] / totalEnquiries) * 100}%` }} />
                    ) : null,
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
                  {ENQUIRY_STATUS_ORDER.map((s) => (
                    <Link key={s} href={`/admin/enquiries?status=${s}`} className="inline-flex items-center gap-1.5 hover:text-slate-800">
                      <span className={`h-2 w-2 rounded-full ${PIPELINE_COLOUR[s]}`} />
                      {ENQUIRY_STATUS[s].label}
                      <span className="font-semibold tabular-nums text-slate-700">{statusCounts[s]}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          }
        >
          {recent && recent.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {recent.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} className={ui.row}>
                    <Avatar name={e.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{e.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {ENQUIRY_TYPE[e.enquiry_type]}
                        {e.subject ? ` · ${e.subject}` : ''}
                      </p>
                    </div>
                    <Badge tone={ENQUIRY_STATUS[e.status].tone} dot>
                      {ENQUIRY_STATUS[e.status].label}
                    </Badge>
                    <span className="hidden w-24 shrink-0 text-right text-xs text-slate-400 sm:block">{timeAgo(e.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={InboxIcon} title="No enquiries yet" description="New leads from the website will appear here." />
          )}
        </Card>

        <div className="space-y-6">
          {/* Marg sync */}
          <Card
            title="Marg sync"
            description="Stock & prices from your billing software"
            icon={RefreshIcon}
            tone="blue"
            actions={
              <Badge tone={syncStatus.tone} dot>
                {syncStatus.label}
              </Badge>
            }
            footer={
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href="/admin/marg" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Open Marg Sync
                </Link>
                {isAdmin && (
                  <ActionForm action={syncMargNow} successMessage="Sync finished">
                    <input type="hidden" name="kind" value="changes" />
                    <SubmitButton pendingText="Syncing…" size="sm">
                      <RefreshIcon className="h-3.5 w-3.5" />
                      Sync now
                    </SubmitButton>
                  </ActionForm>
                )}
              </div>
            }
          >
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Last successful sync</dt>
                <dd className="font-medium text-slate-900">
                  {lastSuccess ? timeAgo(lastSuccess.finished_at ?? lastSuccess.started_at) : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Automatic sync</dt>
                <dd className="font-medium text-slate-900">{process.env.CRON_SECRET ? 'On' : 'Off'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Marg products</dt>
                <dd className="font-medium tabular-nums text-slate-900">{margTotal.toLocaleString('en-IN')}</dd>
              </div>
            </dl>
            {lastRun?.status === 'failed' && lastRun.error && (
              <p className="mt-4 line-clamp-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{lastRun.error}</p>
            )}
          </Card>

          {/* Catalogue health */}
          <Card title="Catalogue health" description="How much of Marg is ready for the website" icon={TrendingUpIcon} tone="teal">
            {margTotal > 0 ? (
              <ul className="space-y-4">
                {health.map((h) => (
                  <li key={h.label}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">{h.label}</span>
                      <span className="tabular-nums text-slate-500">
                        <span className="font-semibold text-slate-900">{h.value.toLocaleString('en-IN')}</span> /{' '}
                        {margTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <ProgressBar value={h.value} max={margTotal} tone={h.tone} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={PackageIcon}
                title="No Marg products yet"
                description="Run a full sync to import your product list."
                action={
                  <Link href="/admin/marg" className={buttonClass('secondary', 'sm')}>
                    Go to Marg Sync
                  </Link>
                }
              />
            )}
          </Card>
        </div>
      </div>
    </Page>
  )
}

