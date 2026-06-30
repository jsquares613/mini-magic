'use client'

import { createContext, useContext, useState } from 'react'
import { toast } from 'sonner'

type ActionFn = (formData: FormData) => unknown | Promise<unknown>

const PendingContext = createContext(false)

/** Read by `SubmitButton` (or any custom control) inside an `ActionForm`. */
export function usePending() {
  return useContext(PendingContext)
}

/**
 * Reusable submit-state handler for admin Server Action forms.
 *
 * Calls `action` directly (rather than passing it as the form's native
 * `action` prop) so we can await the result here: this lets us show a
 * loading state, a success toast, and turn thrown errors into an error toast
 * instead of the framework's default error-page behaviour. `redirect()`
 * called inside a Server Action still navigates normally either way —
 * Next.js handles that at the RPC layer regardless of how the action was
 * invoked.
 *
 * `children` must be plain JSX (not a render-prop function) so this can be
 * rendered from Server Component pages — pending state is shared with
 * descendants like `SubmitButton` via context instead.
 */
export default function ActionForm({
  action,
  successMessage,
  confirmMessage,
  className,
  onSuccess,
  children,
}: {
  action: ActionFn
  successMessage: string
  confirmMessage?: string
  className?: string
  onSuccess?: () => void
  children: React.ReactNode
}) {
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    if (confirmMessage && !window.confirm(confirmMessage)) return

    const formData = new FormData(e.currentTarget)
    setPending(true)
    try {
      await action(formData)
      toast.success(successMessage)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <PendingContext.Provider value={pending}>
      <form onSubmit={handleSubmit} className={className}>
        {children}
      </form>
    </PendingContext.Provider>
  )
}
