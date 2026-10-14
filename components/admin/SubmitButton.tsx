'use client'

import { usePending } from './ActionForm'
import Spinner from './Spinner'
import { buttonClass, iconButtonClass, type ButtonSize, type ButtonVariant } from './ui'

type Variant = ButtonVariant | 'outline' | 'link' | 'icon' | 'icon-danger'

/** Submit button for use inside `ActionForm`: disables, spins, and swaps text while the action is in flight. */
export default function SubmitButton({
  pendingText,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  pendingText: string
  children: React.ReactNode
  /** `outline` is an alias of `secondary`; `link` is text-only; `icon`/`icon-danger` are square icon actions. */
  variant?: Variant
  size?: ButtonSize
  className?: string
}) {
  const pending = usePending()
  const cls =
    variant === 'link'
      ? `inline-flex items-center gap-1.5 font-medium transition hover:underline disabled:no-underline disabled:opacity-60 ${className}`
      : variant === 'icon' || variant === 'icon-danger'
        ? iconButtonClass(variant === 'icon-danger' ? 'danger' : 'default', className)
        : buttonClass(variant === 'outline' ? 'secondary' : variant, size, className)

  return (
    <button type="submit" disabled={pending} className={cls}>
      {pending && <Spinner className="h-4 w-4" />}
      {pending ? pendingText : children}
    </button>
  )
}
