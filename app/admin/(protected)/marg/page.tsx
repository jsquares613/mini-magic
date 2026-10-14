import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/auth'
import { missingMargEnv } from '@/lib/marg/client'
import { productFilterConditions, toLogicTree, type ProductTab } from '@/lib/admin/productFilters'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { syncMargNow } from './actions'

const STATUS_STYLE = {
  running: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
} as const

function formatDateTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
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
  const stats = [
    { label: 'Marg products', value: total, href: '/admin/products?source=marg', accent: 'text-blue-900' },
    { label: 'Published', value: published, href: list('published'), accent: 'text-green-600' },
    { label: 'Drafts', value: drafts, href: list('draft'), accent: 'text-orange-500' },
    { label: 'Ready to publish', value: ready, href: list('ready'), accent: 'text-teal-600' },
    { label: 'Missing photo', value: missingPhoto, href: list('missing-photo'), accent: 'text-purple-600' },
    { label: 'Out of stock', value: outOfStock, href: list('out-of-stock'), accent: 'text-red-500' },
    { label: 'Removed in Marg', value: removed, href: list('removed'), accent: 'text-gray-700' },
  ]

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marg Sync</h1>
        <p className="text-sm text-gray-500">
          Stock, MRP, supplier and billing names come from Marg ERP. New Marg items arrive as drafts — add a name,
          photos and category, then publish. Fields you edit are never overwritten by the sync.
        </p>
      </div>

      {missingEnv.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          Marg sync is not configured. Set <code className="font-mono">{missingEnv.join(', ')}</code> in the server
          environment and restart.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
          >
            <p className={`text-3xl font-bold ${s.accent}`}>{s.value.toLocaleString('en-IN')}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 font-bold text-gray-900">Sync now</h2>
        <p className="mb-5 text-sm text-gray-500">
          Last successful sync: <span className="font-medium text-gray-700">{formatDateTime(lastSuccess?.finished_at ?? null)}</span>
          {lastSuccess?.marg_datetime && <span className="text-gray-400"> (Marg time {lastSuccess.marg_datetime})</span>}
          <br />
          Automatic sync:{' '}
          {cronEnabled ? (
            <span className="font-medium text-gray-700">
              {lastCron ? `last scheduled run ${formatDateTime(lastCron.started_at)}` : 'on — waiting for the first scheduled call'}
            </span>
          ) : (
            <span className="font-medium text-orange-600">off — set CRON_SECRET and schedule /api/cron/marg-sync</span>
          )}
        </p>
        {isAdmin ? (
          <div className="flex flex-wrap gap-3">
            <ActionForm action={syncMargNow} successMessage="Sync finished">
              <input type="hidden" name="kind" value="changes" />
              <SubmitButton pendingText="Syncing…" className="px-5 py-2.5">
                Sync changes
              </SubmitButton>
            </ActionForm>
            <ActionForm
              action={syncMargNow}
              successMessage="Full sync finished"
              confirmMessage="Download every product from Marg? This takes longer than a changes-only sync."
            >
              <input type="hidden" name="kind" value="full" />
              <SubmitButton pendingText="Running full sync…" variant="outline" className="px-5 py-2.5">
                Full sync
              </SubmitButton>
            </ActionForm>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Only admins can start a sync.</p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <h2 className="border-b border-gray-100 px-6 py-4 font-bold text-gray-900">Sync history</h2>
        {runs && runs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3 font-medium">Started</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Received</th>
                  <th className="px-6 py-3 font-medium">New</th>
                  <th className="px-6 py-3 font-medium">Updated</th>
                  <th className="px-6 py-3 font-medium">Deleted</th>
                  <th className="px-6 py-3 font-medium">Missing</th>
                  <th className="px-6 py-3 font-medium">Took</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-t border-gray-50 align-top hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-700">
                      {formatDateTime(r.started_at)}
                      <span className="block text-xs text-gray-400">{r.source}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{r.kind === 'full' ? 'Full' : 'Changes'}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                      {r.error && <span className="mt-1 block max-w-xs text-xs text-red-600">{r.error}</span>}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{r.received}</td>
                    <td className="px-6 py-3 text-gray-700">{r.inserted}</td>
                    <td className="px-6 py-3 text-gray-700">{r.updated}</td>
                    <td className="px-6 py-3 text-gray-700">{r.deleted}</td>
                    <td className="px-6 py-3 text-gray-700">{r.missing}</td>
                    <td className="px-6 py-3 text-gray-400">{duration(r.started_at, r.finished_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No syncs yet. Run a full sync to import products from Marg.</p>
        )}
      </section>
    </div>
  )
}
