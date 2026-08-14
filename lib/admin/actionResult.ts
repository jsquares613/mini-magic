/**
 * Server Actions that cross the Next.js RSC boundary have thrown `Error`
 * messages redacted to a generic string in production builds — even for
 * deliberate, expected errors (a blocked delete, a failed write), not just
 * unexpected crashes. Actions that need the real message to reach the admin
 * user must `return { error }` instead of throwing.
 */
export type ActionResult<T = void> = T | { error: string }

export function isActionError(result: unknown): result is { error: string } {
  return (
    !!result &&
    typeof result === 'object' &&
    'error' in result &&
    typeof (result as { error: unknown }).error === 'string'
  )
}

/** For direct (non-ActionForm) call sites with their own try/catch: throws
 *  client-side (never crossing the server boundary, so the message survives)
 *  if `result` is `{ error }`; otherwise returns it unwrapped. */
export function unwrapAction<T>(result: ActionResult<T>): T {
  if (isActionError(result)) throw new Error(result.error)
  return result as T
}
