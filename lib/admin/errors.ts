/**
 * Turns raw Supabase/Postgres/Storage/Auth errors into messages an admin can
 * act on. Pure functions - safe to import from server actions and client code.
 * The raw error is always logged so nothing is lost for debugging.
 */

type DbError = { code?: string | null; message?: string | null; details?: string | null; hint?: string | null }

/** Column name -> how to describe it to an admin. */
const FIELD_LABELS: Record<string, string> = {
  slug: 'name (it creates the same page address)',
  name: 'name',
  title: 'title',
  marg_code: 'Marg code',
  sku: 'SKU',
  code: 'code',
  email: 'email',
  display_order: 'display order',
  key: 'key',
}

function fieldFrom(error: DbError): string | null {
  const text = `${error.details ?? ''} ${error.message ?? ''}`
  // Unique violation: 'Key (slug)=(toys) already exists.' / 'Key (category_id, slug)=(...)'
  const key = text.match(/Key \(([^)]+)\)/)
  if (key) {
    const cols = key[1].split(',').map((c) => c.trim()).filter((c) => !c.endsWith('_id'))
    const col = cols[cols.length - 1]
    if (col) return FIELD_LABELS[col] ?? col.replace(/_/g, ' ')
  }
  // Not-null violation: 'null value in column "name" ...'
  const column = text.match(/column "([^"]+)"/)
  if (column) return FIELD_LABELS[column[1]] ?? column[1].replace(/_/g, ' ')
  return null
}

/** `thing` is what the admin was saving, e.g. "category" or "product". */
export function friendlyDbError(error: DbError, thing = 'item'): string {
  console.error('[Admin DB error]', error)
  const message = error.message ?? ''
  const field = fieldFrom(error)

  switch (error.code) {
    case '23505':
      return field
        ? `Another ${thing} already uses this ${field}. Please choose a different one.`
        : `This ${thing} already exists. Please change the details and try again.`
    case '23503':
      // Deleting something that other records still point to vs. pointing at something that's gone.
      return /still referenced|is referenced/i.test(message)
        ? `This ${thing} is still in use elsewhere, so it can't be removed. Remove or reassign what uses it first.`
        : `A selected option no longer exists. Refresh the page and pick it again.`
    case '23502':
      return field ? `Please fill in the ${field}.` : 'A required field is missing.'
    case '23514':
      return `One of the values isn't allowed${field ? ` (${field})` : ''}. Please check the form and try again.`
    case '22001':
      return 'One of the fields is too long. Please shorten it and try again.'
    case '22P02':
    case '22007':
    case '22008':
      return 'One of the values is in the wrong format. Please check the form and try again.'
    case '22003':
      return 'A number is too large or too small. Please check the numeric fields.'
    case '42501':
      return "You don't have permission to do that."
    case 'PGRST116':
      return `This ${thing} could not be found. It may have been deleted - refresh the page.`
    case 'PGRST301':
    case 'PGRST303':
      return 'Your session has expired. Please sign in again.'
    case '40001':
    case '40P01':
    case '57014':
      return 'The server was busy. Please try again.'
  }

  if (/fetch failed|network|timeout|timed out|ECONNRESET|ENOTFOUND/i.test(message)) {
    return "Couldn't reach the database. Check your connection and try again."
  }
  return `Couldn't save the ${thing}. Please try again, and contact support if it keeps happening.`
}

/** Sign-in errors from Supabase Auth. */
export function friendlyAuthError(error: { message?: string | null; code?: string | null; status?: number | null }): string {
  const message = error.message ?? ''
  if (error.code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return 'Incorrect email or password.'
  }
  if (error.code === 'email_not_confirmed' || /not confirmed/i.test(message)) {
    return 'This email address has not been confirmed yet.'
  }
  if (error.code === 'over_request_rate_limit' || error.status === 429 || /rate limit|too many/i.test(message)) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  if (/banned|disabled/i.test(message)) return 'This account has been disabled.'
  if (/fetch|network/i.test(message)) return "Couldn't reach the server. Check your connection and try again."
  return "Couldn't sign you in. Please try again."
}

/** Failures from image/file uploads and removals (Supabase Storage or the browser). */
export function friendlyUploadError(err: unknown, fallback = 'Upload failed. Please try again.'): string {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  if (/payload too large|exceeded the maximum|too large|file size/i.test(message)) {
    return 'That file is too large. Please choose a smaller one.'
  }
  if (/mime|invalid file type|not supported|unsupported/i.test(message)) {
    return 'That file type is not supported. Use JPG, PNG or WebP.'
  }
  if (/already exists|duplicate/i.test(message)) {
    return 'A file with that name already exists. Rename it and try again.'
  }
  if (/row-level security|not authori[sz]ed|permission|jwt/i.test(message)) {
    return "You don't have permission to upload. Try signing in again."
  }
  if (/fetch|network|failed to fetch|timeout/i.test(message)) {
    return "Couldn't reach the server. Check your connection and try again."
  }
  // Our own messages (from server actions or client checks) are full sentences - keep them.
  if (/^[A-Z].*[.!]$/.test(message) && !/violates|constraint|policy|relation/i.test(message)) return message
  return fallback
}
