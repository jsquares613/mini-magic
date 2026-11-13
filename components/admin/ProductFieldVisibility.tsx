'use client'

import { createContext, useContext, useState, useTransition, type ReactNode } from 'react'
import { toast } from 'sonner'
import { setProductFieldVisible } from '@/app/admin/(protected)/products/actions'
import { isActionError } from '@/lib/admin/actionResult'
import { PRODUCT_FIELDS, type ProductFieldKey } from '@/lib/productFields'
import { CheckIcon } from './icons'
import { ui } from './ui'

/**
 * Catalogue-wide on/off switches for optional product fields - the small tick
 * box beside a field's heading on the product form. Turning one off hides the
 * field from this form for every product (and from the storefront, for
 * customer-facing fields). Saved values are kept, so turning it back on brings
 * them back. Only admins see the tick boxes.
 */
interface FieldVisibility {
  isOn: (field: ProductFieldKey) => boolean
  canConfigure: boolean
  toggle: (field: ProductFieldKey) => void
  pendingField: ProductFieldKey | null
}

const Ctx = createContext<FieldVisibility>({
  isOn: () => true,
  canConfigure: false,
  toggle: () => {},
  pendingField: null,
})

export function useFieldOn(field: ProductFieldKey): boolean {
  return useContext(Ctx).isOn(field)
}

export function FieldVisibilityProvider({
  initialHidden,
  canConfigure,
  children,
}: {
  initialHidden: ProductFieldKey[]
  canConfigure: boolean
  children: ReactNode
}) {
  const [hidden, setHidden] = useState(() => new Set(initialHidden))
  const [pendingField, setPendingField] = useState<ProductFieldKey | null>(null)
  const [, startTransition] = useTransition()

  function toggle(field: ProductFieldKey) {
    const turnOn = hidden.has(field)
    const previous = hidden
    const next = new Set(hidden)
    if (turnOn) next.delete(field)
    else next.add(field)
    setHidden(next)
    setPendingField(field)
    startTransition(async () => {
      try {
        const result = await setProductFieldVisible(field, turnOn)
        if (isActionError(result)) throw new Error(result.error)
        setHidden(new Set(result))
        const { label, storefront } = PRODUCT_FIELDS[field]
        toast.success(
          turnOn
            ? `${label} turned on for all products`
            : `${label} turned off for all products${storefront ? ' and hidden on the website' : ''}`,
        )
      } catch (err) {
        setHidden(previous)
        toast.error(err instanceof Error ? err.message : 'Couldn’t change the field')
      } finally {
        setPendingField(null)
      }
    })
  }

  return (
    <Ctx.Provider value={{ isOn: (f) => !hidden.has(f), canConfigure, toggle, pendingField }}>{children}</Ctx.Provider>
  )
}

/** The tick box. Ticked = field in use. Renders nothing for non-admins. */
export function FieldToggle({ field, className = '' }: { field: ProductFieldKey; className?: string }) {
  const { isOn, canConfigure, toggle, pendingField } = useContext(Ctx)
  if (!canConfigure) return null
  const on = isOn(field)
  const { label } = PRODUCT_FIELDS[field]
  const title = on ? `${label} is on - untick to turn it off for all products` : `${label} is off - tick to turn it on for all products`
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={`Use the ${label} field`}
      title={title}
      disabled={pendingField === field}
      onClick={() => toggle(field)}
      className={`inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[10px] font-semibold uppercase tracking-wide transition disabled:opacity-60 ${
        on
          ? 'border-blue-900 bg-blue-900 text-white hover:bg-blue-800'
          : 'border-slate-300 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-600'
      } ${className}`}
    >
      <span className={`flex h-3 w-3 items-center justify-center rounded-sm ${on ? 'bg-white text-blue-900' : 'border border-slate-300'}`}>
        {on && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3.5} />}
      </span>
      {on ? 'On' : 'Off'}
    </button>
  )
}

/** Shown in place of a switched-off field. */
export function FieldOffNote({ field }: { field: ProductFieldKey }) {
  const { storefront } = PRODUCT_FIELDS[field]
  return (
    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-400">
      Turned off for all products{storefront ? ' - not shown on the website' : ''}. Saved values are kept.
    </p>
  )
}

/**
 * A labelled form field with the on/off tick box beside its heading. When the
 * field is off its input isn't rendered, so nothing is submitted for it (the
 * server ignores switched-off fields too).
 */
export function OptionalField({
  field,
  label,
  hint,
  htmlFor,
  children,
  className = '',
}: {
  field: ProductFieldKey
  label?: ReactNode
  hint?: ReactNode
  /** id of the input, so clicking the heading focuses it. */
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  const on = useFieldOn(field)
  const heading = label ?? PRODUCT_FIELDS[field].label
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={`${ui.label} !mb-0 ${on ? '' : 'text-slate-400'}`}>
            {heading}
          </label>
        ) : (
          <span className={`${ui.label} !mb-0 ${on ? '' : 'text-slate-400'}`}>{heading}</span>
        )}
        <FieldToggle field={field} />
      </div>
      {on ? (
        <>
          {children}
          {hint && <span className={ui.hint}>{hint}</span>}
        </>
      ) : (
        <FieldOffNote field={field} />
      )}
    </div>
  )
}
