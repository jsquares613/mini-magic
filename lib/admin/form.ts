/** Shared FormData parsing helpers for admin Server Actions. */

export function str(fd: FormData, k: string): string | null {
  const v = fd.get(k)
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

export function num(fd: FormData, k: string): number | null {
  const v = str(fd, k)
  return v == null ? null : Number(v)
}

export function int(fd: FormData, k: string, fallback = 0): number {
  const v = num(fd, k)
  return v == null || Number.isNaN(v) ? fallback : Math.trunc(v)
}

export function bool(fd: FormData, k: string): boolean {
  return fd.get(k) === 'on' || fd.get(k) === 'true'
}

export function commaList(fd: FormData, k: string): string[] {
  return (str(fd, k) ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

/** One value per line — e.g. a "Features" or "Rules" textarea. */
export function lineList(fd: FormData, k: string): string[] {
  return (str(fd, k) ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
}

/**
 * One "Label | Value" pair per line — e.g. Play Area's Timings/Pricing textareas,
 * stored as a `[{label, value}]` JSONB array. Lines without a `|` are skipped.
 */
export function pairList(fd: FormData, k: string): { label: string; value: string }[] {
  return lineList(fd, k)
    .map((line) => {
      const [label, value] = line.split('|').map((s) => s.trim())
      return label && value ? { label, value } : null
    })
    .filter((pair): pair is { label: string; value: string } => pair !== null)
}

/**
 * Reads a `<input type="datetime-local">` value and returns an ISO timestamp
 * (or null when empty). Used for scheduling fields (`starts_at`/`ends_at`).
 */
export function dateTime(fd: FormData, k: string): string | null {
  const v = str(fd, k)
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Converts an ISO timestamp back to the `datetime-local` input format. */
export function toDateTimeInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
