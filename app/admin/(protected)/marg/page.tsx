import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { missingMargEnv } from '@/lib/marg/client'
import { timeAgo } from '@/lib/format'
import { productFilterConditions, toLogicTree, type ProductTab } from '@/lib/admin/productFilters'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { Badge, Card, EmptyState, Page, PageHeader, StatCard, ui, type Tone } from '@/components/admin/ui'
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  FileTextIcon,
  ImageIcon,
  PackageIcon,
  RefreshIcon,
  XCircleIcon,
} from '@/components/admin/icons'
import { syncMargNow } from './actions'

const RUN_STATUS: Record<'running' | 'success' | 'failed', { label: string; tone: Tone }> = {
  running: { label: 'Running', tone: 'blue' },
  success: { label: 'Success', tone: 'green' },
  failed: { label: 'Failed', tone: 'red' },
}

function formatDateTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : '—'
}

function duration(start: string, end: string | null) {
  if (!end) return '—'
  const s = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

export default async function MargSyncPage() {
  const supabase = createServerSupabase()

  // Each card counts the same products its link lists (lib/admin/productFilters.ts).
  const countMarg = async (status: ProductTab) => {
    // source 'marg' always yields a condition, so the tree is never null.
    const tree = toLogicTree(productFilterConditions({ status, source: 'marg', supplier: '', q: '' })) as string
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).or(tree)
    return count ?? 0
  }

  const [profile, total, published, drafts, ready, missingPhoto, outOfStock, removed, { data: runs }] = await Promise.all([
    getCurrentProfile(),
    countMarg('all'),
    countMarg('published'),
    countMarg('draft'),
    countMarg('ready'),
    countMarg('missing-photo'),
    countMarg('out-of-stock'),
    countMarg('removed'),
    supabase.from('marg_sync_runs').select('*').order('started_at', { ascending: false }).limit(20),
  ])

  const missingEnv = missingMargEnv()
  const lastSuccess = (runs ?? []).find((r) => r.status === 'success')
  const lastCron = (runs ?? []).find((r) => r.source === 'cron')
  const cronEnabled = Boolean(process.env.CRON_SECRET)
  const isAdmin = profile?.role === 'admin'

  const list = (status: ProductTab) => `/admin/products?status=${status}&source=marg`

  return (
    <Page>
      <PageHeader
        title="Marg Sync"
        description="Stock, MRP, supplier and billing names come from Marg ERP. New Marg items arrive as drafts — add a name, photos and a category, then publish. Fields you edit are never overwritten."
        meta={
          lastSuccess ? (
            <Badge tone="green" dot>
              Synced {timeAgo(lastSuccess.finished_at ?? lastSuccess.started_at)}
            </Badge>
          ) : (
            <Badge tone="gray" dot>
              Never synced
            </Badge>
          )
        }
        actions={
          isAdmin ? (
            <>
              <ActionForm
                action={syncMargNow}
                successMessage="Full sync finished"
                confirmMessage="Download every product from Marg? This takes longer than a changes-only sync."
              >
                <input type="hidden" name="kind" value="full" />
                <SubmitButton pendingText="Running full sync…" variant="secondary">
                  Full sync
                </SubmitButton>
              </ActionForm>
              <ActionForm action={syncMargNow} successMessage="Sync finished">
                <input type="hidden" name="kind" value="changes" />
                <SubmitButton pendingText="Syncing…">
                  <RefreshIcon className="h-4 w-4" />
                  Sync changes
                </SubmitButton>
              </ActionForm>
            </>
          ) : undefined
        }
      />

      {missingEnv.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Marg sync is not configured. Set <code className="rounded bg-amber-100 px-1 font-mono text-xs">{missingEnv.join(', ')}</code> in
            the server environment and restart.
          </p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Marg products" value={total} icon={PackageIcon} tone="blue" href="/admin/products?source=marg" hint="Everything Marg sends us" />
        <StatCard label="Published" value={published} icon={EyeIcon} tone="green" href={list('published')} hint="Live on the website" />
        <StatCard label="Ready to publish" value={ready} icon={CheckCircleIcon} tone="teal" href={list('ready')} hint="Photo and category added" />
        <StatCard label="Missing photo" value={missingPhoto} icon={ImageIcon} tone="amber" href={list('missing-photo')} hint="Needed before publishing" />
        <StatCard label="Drafts" value={drafts} icon={FileTextIcon} tone="gray" href={list('draft')} hint="Not on the website yet" />
        <StatCard label="Out of stock" value={outOfStock} icon={XCircleIcon} tone="red" href={list('out-of-stock')} hint="Marg stock is zero" />
        <StatCard label="Removed in Marg" value={removed} icon={AlertTriangleIcon} tone="red" href={list('removed')} hint="Deleted or no longer listed" />
        <StatCard
          label="Automatic sync"
          value={cronEnabled ? 'On' : 'Off'}
          icon={ClockIcon}
          tone={cronEnabled ? 'green' : 'gray'}
          hint={
            cronEnabled
              ? lastCron
                ? `Last scheduled run ${timeAgo(lastCron.started_at)}`
                : 'Waiting for the first scheduled call'
              : 'Set CRON_SECRET to enable'
          }
        />
      </div>

      <Card
        title="Sync history"
        description="The last 20 runs, newest first."
        icon={ClockIcon}
        tone="gray"
        bodyClassName="p-0"
        actions={
          lastSuccess?.marg_datetime ? <span className="text-xs text-slate-500">Marg time {lastSuccess.marg_datetime}</span> : undefined
        }
      >
        {runs && runs.length > 0 ? (
          <div className="admin-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>Started</th>
                  <th className={ui.th}>Type</th>
                  <th className={ui.th}>Status</th>
                  <th className={`${ui.th} text-right`}>Received</th>
                  <th className={`${ui.th} text-right`}>New</th>
                  <th className={`${ui.th} text-right`}>Updated</th>
                  <th className={`${ui.th} text-right`}>Deleted</th>
                  <th className={`${ui.th} text-right`}>Missing</th>
                  <th className={`${ui.th} text-right`}>Took</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((r) => (
                  <tr key={r.id} className="align-top transition hover:bg-slate-50/70">
                    <td className={ui.td}>
                      <span className="block font-medium text-slate-900">{formatDateTime(r.started_at)}</span>
                      <span className="text-xs capitalize text-slate-500">{r.source === 'cron' ? 'Scheduled' : 'Manual'}</span>
                    </td>
                    <td className={`${ui.td} text-slate-600`}>{r.kind === 'full' ? 'Full' : 'Changes'}</td>
                    <td className={ui.td}>
                      <Badge tone={RUN_STATUS[r.status].tone} dot>
                        {RUN_STATUS[r.status].label}
                      </Badge>
                      {r.error && <span className="mt-1.5 block max-w-xs text-xs text-rose-600">{r.error}</span>}
                    </td>
                    <td className={`${ui.td} text-right tabular-nums text-slate-700`}>{r.received.toLocaleString('en-IN')}</td>
                    <td className={`${ui.td} text-right tabular-nums text-slate-700`}>{r.inserted.toLocaleString('en-IN')}</td>
                    <td className={`${ui.td} text-right tabular-nums text-slate-700`}>{r.updated.toLocaleString('en-IN')}</td>
                    <td className={`${ui.td} text-right tabular-nums text-slate-700`}>{r.deleted.toLocaleString('en-IN')}</td>
                    <td className={`${ui.td} text-right tabular-nums text-slate-700`}>{r.missing.toLocaleString('en-IN')}</td>
                    <td className={`${ui.td} text-right tabular-nums text-slate-500`}>{duration(r.started_at, r.finished_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={RefreshIcon}
            title="No syncs yet"
            description={
              <>
                Run a <span className="font-medium text-slate-700">Full sync</span> to import your product list from Marg.
              </>
            }
            action={
              <Link href="/admin/products?source=marg" className="text-sm font-medium text-blue-700 hover:underline">
                View Marg products
              </Link>
            }
          />
        )}
      </Card>
    </Page>
  )
}
