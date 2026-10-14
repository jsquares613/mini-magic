import { revalidatePath } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/format'
import { fetchMargProducts, getMargConfig, type MargConfig, type MargItem } from './client'

/**
 * Marg → Supabase product sync. SERVER ONLY.
 *
 * - `full`    asks Marg for every product. New codes become unpublished
 *             drafts; codes Marg no longer lists get `marg_missing_since`
 *             (flagged for staff, never auto-unpublished).
 * - `changes` asks only for what changed since the last successful run
 *             (falls back to `full` when there is none yet).
 *
 * Marg-owned fields are written through `marg_apply_items()` (see migration
 * 20261014100000_marg_sync.sql), which keeps staff-edited fields untouched.
 */

/** Marg suppliers that are not retail products (Play Area tickets are billed through Marg). */
export const MARG_EXCLUDED_COMPANIES = ['PLAY AREA']

const BATCH_SIZE = 500
/** A run still "running" after this long died mid-way (e.g. server restart). */
const STALE_RUN_MS = 30 * 60 * 1000
/** Re-ask a few minutes before the last sync — applying a change twice is harmless, missing one isn't. */
const OVERLAP_MS = 5 * 60 * 1000
/** Marg reports and accepts times in IST. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export type MargSyncKind = 'full' | 'changes'

export interface MargSyncSummary {
  kind: MargSyncKind
  received: number
  inserted: number
  updated: number
  deleted: number
  missing: number
}

export interface MargSyncFailure {
  error: string
  /** Another sync was already running — nothing was attempted. */
  busy?: boolean
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e))

function chunks<T>(list: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

/** A Date as Marg's "YYYY-MM-DD HH:mm:ss" IST string. */
function toMargDatetime(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 19).replace('T', ' ')
}

function shiftMargDatetime(value: string, ms: number): string {
  const t = Date.parse(`${value.replace(' ', 'T')}Z`)
  return Number.isNaN(t) ? value : new Date(t + ms).toISOString().slice(0, 19).replace('T', ' ')
}

function toApplyRow(item: MargItem) {
  return {
    code: item.code,
    name: item.name,
    // Only used for brand-new drafts; staff can rename later.
    slug: item.name ? [slugify(item.name), slugify(item.code)].filter(Boolean).join('-') || 'marg-item' : null,
    company: item.company,
    mrp: item.mrp,
    stock: item.stock,
  }
}

export async function runMargSync(opts: {
  kind: MargSyncKind
  source: 'manual' | 'cron'
  startedBy?: string | null
}): Promise<MargSyncSummary | MargSyncFailure> {
  let cfg: MargConfig
  try {
    cfg = getMargConfig()
  } catch (e) {
    return { error: errorMessage(e) }
  }
  const sb = getServiceClient()

  await sb
    .from('marg_sync_runs')
    .update({ status: 'failed', error: 'Timed out', finished_at: new Date().toISOString() })
    .eq('status', 'running')
    .lt('started_at', new Date(Date.now() - STALE_RUN_MS).toISOString())

  let kind = opts.kind
  let since: string | null = null
  if (kind === 'changes') {
    const { data: last } = await sb
      .from('marg_sync_runs')
      .select('marg_datetime, started_at')
      .eq('status', 'success')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (last) since = shiftMargDatetime(last.marg_datetime ?? toMargDatetime(new Date(last.started_at)), -OVERLAP_MS)
    else kind = 'full'
  }

  const { data: run, error: runError } = await sb
    .from('marg_sync_runs')
    .insert({ kind, source: opts.source, since, started_by: opts.startedBy ?? null })
    .select('id, started_at')
    .single()
  if (runError) {
    // marg_sync_runs_one_running
    if (runError.code === '23505') return { error: 'A Marg sync is already running — try again shortly.', busy: true }
    return { error: runError.message }
  }

  try {
    const { items, margDatetime } = await fetchMargProducts(since, cfg)

    const excluded = new Set(MARG_EXCLUDED_COMPANIES)
    const relevant = items.filter((i) => !(i.company && excluded.has(i.company.toUpperCase())))
    const live = relevant.filter((i) => !i.deleted)
    const deletedCodes = relevant.filter((i) => i.deleted).map((i) => i.code)

    let inserted = 0
    let updated = 0
    for (const batch of chunks(live, BATCH_SIZE)) {
      const { data, error } = await sb.rpc('marg_apply_items', { items: batch.map(toApplyRow) })
      if (error) throw new Error(error.message)
      const counts = (data ?? {}) as { inserted?: number; updated?: number }
      inserted += counts.inserted ?? 0
      updated += counts.updated ?? 0
    }

    let deleted = 0
    for (const codes of chunks(deletedCodes, 200)) {
      const { count, error } = await sb
        .from('products')
        .update({ marg_deleted_at: new Date().toISOString(), is_published: false }, { count: 'exact' })
        .in('marg_code', codes)
        .is('marg_deleted_at', null)
      if (error) throw new Error(error.message)
      deleted += count ?? 0
    }

    let missing = 0
    if (kind === 'full') {
      // Every product Marg still lists was just touched (marg_synced_at = now()).
      const { count, error } = await sb
        .from('products')
        .update({ marg_missing_since: new Date().toISOString() }, { count: 'exact' })
        .not('marg_code', 'is', null)
        .is('marg_missing_since', null)
        .is('marg_deleted_at', null)
        .lt('marg_synced_at', run.started_at)
      if (error) throw new Error(error.message)
      missing = count ?? 0
    }

    const summary: MargSyncSummary = { kind, received: items.length, inserted, updated, deleted, missing }
    await sb
      .from('marg_sync_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        marg_datetime: margDatetime ?? toMargDatetime(new Date(run.started_at)),
        received: summary.received,
        inserted,
        updated,
        deleted,
        missing,
      })
      .eq('id', run.id)

    if (inserted + updated + deleted > 0) revalidatePath('/', 'layout')
    return summary
  } catch (e) {
    await sb
      .from('marg_sync_runs')
      .update({ status: 'failed', error: errorMessage(e), finished_at: new Date().toISOString() })
      .eq('id', run.id)
    return { error: errorMessage(e) }
  }
}
