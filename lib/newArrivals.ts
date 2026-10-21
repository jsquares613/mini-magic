/**
 * New Arrivals rules, shared by the storefront and the admin.
 *
 * A product is new stock from when it's created (a new Marg item code, or added
 * by hand) or marked as new by staff — `new_since`, stamped by the database. It
 * arrives for customers when that's true *and* it's published — `arrived_at`,
 * the later of the two dates — so the days it waits for photos don't count. The
 * storefront lists arrivals newest first, so each new product pushes the oldest
 * out of the homepage rail, and a product counts as "new" for `days` after it
 * arrives (the `new_arrival_days` site setting).
 */

export const NEW_ARRIVAL_DEFAULT_DAYS = 30
export const NEW_ARRIVAL_MAX_DAYS = 365
/** Products in the homepage rail — and the fewest the New Arrivals page shows. */
export const NEW_ARRIVALS_RAIL_SIZE = 12

const DAY_MS = 24 * 60 * 60 * 1000

/** A stored/typed day count, or the default when missing or out of range. */
export function clampNewArrivalDays(value: unknown): number {
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n >= 1 ? Math.min(n, NEW_ARRIVAL_MAX_DAYS) : NEW_ARRIVAL_DEFAULT_DAYS
}

/** When a product that arrived at `arrivedAt` stops counting as new. */
export function newUntil(arrivedAt: string, days: number): Date {
  return new Date(Date.parse(arrivedAt) + days * DAY_MS)
}

export function isNewArrival(arrivedAt: string | null, days: number, now = Date.now()): boolean {
  return arrivedAt != null && newUntil(arrivedAt, days).getTime() > now
}

export type NewArrivalState =
  /** Arrived, and still within its "new" period. */
  | { state: 'new'; until: Date }
  /** New stock that hasn't been published yet — it arrives when it is. */
  | { state: 'waiting' }
  /** Was a new arrival; the period is over. */
  | { state: 'expired'; until: Date }
  /** Not a new arrival. */
  | { state: 'none' }

type ArrivalDates = { new_since: string | null; arrived_at: string | null }

export function newArrivalState(p: ArrivalDates, days: number, now = Date.now()): NewArrivalState {
  if (!p.new_since) return { state: 'none' }
  if (!p.arrived_at) return { state: 'waiting' }
  const until = newUntil(p.arrived_at, days)
  return until.getTime() > now ? { state: 'new', until } : { state: 'expired', until }
}

/** "3 Nov" in shop time. */
export function shortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
}

/**
 * The product form's "New arrival" switch: on while the product is (or is about
 * to be) a new arrival, with a line explaining where it stands.
 */
export function newArrivalSwitch(
  p: (ArrivalDates & { is_published: boolean }) | undefined,
  days: number,
  now = Date.now(),
): { on: boolean; hint: string } {
  if (!p) return { on: true, hint: 'New products join New Arrivals once published.' }
  const s = newArrivalState(p, days, now)
  switch (s.state) {
    case 'new':
      return {
        on: true,
        hint: `In New Arrivals until ${shortDate(s.until)}${p.is_published ? '.' : ', while published.'}`,
      }
    case 'waiting':
      return { on: true, hint: 'New stock: joins New Arrivals when you publish it.' }
    case 'expired':
      return { on: false, hint: `Was new until ${shortDate(s.until)}. Turn on to feature it again from today.` }
    default:
      return { on: false, hint: 'Turn on to show it in New Arrivals from today.' }
  }
}

/**
 * What saving the switch does to `new_since`: turning it on starts a fresh "new"
 * period today; turning it off removes the product; leaving it as shown changes
 * nothing (undefined), so saving other edits never resets the date.
 */
export function newSinceFromSwitch(p: ArrivalDates, on: boolean, days: number, now = Date.now()): string | null | undefined {
  const s = newArrivalState(p, days, now).state
  const wasOn = s === 'new' || s === 'waiting'
  if (on === wasOn) return undefined
  return on ? new Date(now).toISOString() : null
}
