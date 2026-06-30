'use client'

import { usePending } from './ActionForm'
import Spinner from './Spinner'

const VARIANTS = {
  primary: 'bg-blue-900 text-sm font-semibold text-white hover:bg-blue-800',
  danger: 'border border-red-300 text-sm font-semibold text-red-600 hover:bg-red-50',
  secondary: 'bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200',
  success: 'bg-green-600 text-sm font-semibold text-white hover:bg-green-700',
  outline: 'border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50',
  // Fully color/size-agnostic — caller must pass both via `className` (e.g.
  // "text-xs text-red-600"), since these show up at multiple sizes in lists.
  link: 'font-medium hover:underline disabled:no-underline',
} as const

/** Submit button for use inside `ActionForm`: disables, spins, and swaps text while the action is in flight. */
export default function SubmitButton({
  pendingText,
  children,
  variant = 'primary',
  className = 'px-4 py-2',
}: {
  pendingText: string
  children: React.ReactNode
  variant?: keyof typeof VARIANTS
  className?: string
}) {
  const pending = usePending()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {pending && <Spinner />}
      {pending ? pendingText : children}
    </button>
  )
}
