import { timingSafeEqual } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { runMargSync } from '@/lib/marg/sync'

/**
 * Scheduled Marg sync, called by an external scheduler (the app runs in a
 * container that may sleep between requests, so it can't time itself).
 *
 *   GET|POST /api/cron/marg-sync              → changes since the last sync
 *   GET|POST /api/cron/marg-sync?kind=full    → full sync (also flags items Marg dropped)
 *
 * Requires `Authorization: Bearer <CRON_SECRET>`. Without CRON_SECRET set,
 * the endpoint refuses every call.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function authorized(request: NextRequest, secret: string): boolean {
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ ok: false, error: 'CRON_SECRET is not configured.' }, { status: 503 })
  if (!authorized(request, secret)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const kind = request.nextUrl.searchParams.get('kind') === 'full' ? 'full' : 'changes'
  const result = await runMargSync({ kind, source: 'cron' })

  if ('error' in result) {
    // An overlapping run isn't a failure — report it without tripping the scheduler's alerts.
    if (result.busy) return NextResponse.json({ ok: false, skipped: true, reason: result.error })
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ ok: true, ...result })
}

export const GET = handle
export const POST = handle
