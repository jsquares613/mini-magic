import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronLeftIcon, type Icon } from './icons'

/**
 * Admin design system — one place for the panel's look.
 *
 * Server-safe (no hooks), so Server and Client Components share the same
 * pieces: page header, cards, KPI tiles, badges, form fields, switches,
 * button classes. Colours are full class strings (never interpolated) so
 * Tailwind's JIT picks them up.
 */

/* ---------------------------------- Tokens ---------------------------------- */
export const ui = {
  input:
    'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
  /** Compact inline control (filter bars, bulk actions) — same look as `input`, natural width. */
  control:
    'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10',
  label: 'mb-1.5 block text-sm font-medium text-slate-700',
  hint: 'mt-1.5 block text-xs text-slate-500',
  checkbox: 'h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-900',
  /** A row inside a divided list card. */
  row: 'flex items-center gap-4 px-6 py-3.5 transition hover:bg-slate-50/70',
  thead: 'border-b border-slate-200 bg-slate-50/80',
  th: 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500',
  td: 'px-6 py-3.5',
} as const

export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'teal' | 'violet' | 'gray'

const BADGE_TONES: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  gray: 'bg-slate-50 text-slate-600 ring-slate-500/20',
}

const TILE_TONES: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-700/10',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
  amber: 'bg-amber-50 text-amber-700 ring-amber-700/10',
  red: 'bg-rose-50 text-rose-700 ring-rose-700/10',
  teal: 'bg-teal-50 text-teal-700 ring-teal-700/10',
  violet: 'bg-violet-50 text-violet-700 ring-violet-700/10',
  gray: 'bg-slate-100 text-slate-600 ring-slate-600/10',
}

const BAR_TONES: Record<Tone, string> = {
  blue: 'bg-blue-600',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
  teal: 'bg-teal-500',
  violet: 'bg-violet-500',
  gray: 'bg-slate-400',
}

/* --------------------------------- Buttons ---------------------------------- */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blue-900 text-white shadow-sm hover:bg-blue-800 focus-visible:ring-blue-500/30',
  secondary:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400/25',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400/25',
  danger:
    'border border-rose-200 bg-white text-rose-600 shadow-sm hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-rose-500/25',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500/30',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
}

/** Classes for a button-looking element (buttons and links alike). */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = ''): string {
  return `inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${extra}`.trim()
}

/** Square icon-only action (edit, delete, toggle…) — pair with an sr-only label. */
export function iconButtonClass(tone: 'default' | 'danger' = 'default', extra = ''): string {
  const colours =
    tone === 'danger' ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
  return `inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/25 disabled:cursor-not-allowed disabled:opacity-60 ${colours} ${extra}`.trim()
}

/* --------------------------------- Layout ----------------------------------- */
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-4 py-6 md:px-8 md:py-8 ${className}`}>{children}</div>
}

export function PageHeader({
  title,
  description,
  back,
  meta,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  /** Breadcrumb-style link back to the parent page. */
  back?: { href: string; label: string }
  /** Badges shown next to the title. */
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link
          href={back.href}
          className="group mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ChevronLeftIcon className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h1>
            {meta}
          </div>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}

export function IconTile({ icon: IconCmp, tone = 'blue', size = 'md' }: { icon: Icon; tone?: Tone; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center ring-1 ring-inset ${TILE_TONES[tone]} ${
        size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl'
      }`}
      aria-hidden="true"
    >
      <IconCmp className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
    </span>
  )
}

export function Card({
  title,
  description,
  icon,
  tone = 'blue',
  actions,
  footer,
  children,
  className = '',
  bodyClassName = 'p-6',
  id,
}: {
  title?: ReactNode
  description?: ReactNode
  icon?: Icon
  tone?: Tone
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  /** Body padding/layout; use 'p-0' for edge-to-edge lists and tables. */
  bodyClassName?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {icon && <IconTile icon={icon} tone={tone} size="sm" />}
            <div className="min-w-0">
              {title && <h2 className="text-[15px] font-semibold leading-8 text-slate-900">{title}</h2>}
              {description && <p className="-mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3">{footer}</div>}
    </section>
  )
}

/** Sticky save bar at the bottom of a page-level form. */
export function FormActions({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {note && <p className="mr-auto text-sm text-slate-500">{note}</p>}
        {children}
      </div>
    </div>
  )
}

/* ------------------------------ Data display -------------------------------- */
export function Badge({
  tone = 'gray',
  dot = false,
  icon: IconCmp,
  title,
  children,
}: {
  tone?: Tone
  dot?: boolean
  icon?: Icon
  title?: string
  children: ReactNode
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE_TONES[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {IconCmp && <IconCmp className="h-3 w-3" />}
      {children}
    </span>
  )
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'blue',
  href,
  hint,
}: {
  label: string
  value: number | string
  icon: Icon
  tone?: Tone
  href?: string
  hint?: ReactNode
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <IconTile icon={icon} tone={tone} />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  )
  const base = 'block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition'
  return href ? (
    <Link href={href} className={`${base} hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  )
}

export function ProgressBar({ value, max, tone = 'blue' }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${BAR_TONES[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

const AVATAR_TONES = [
  'bg-blue-100 text-blue-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',
]

/** Initials in a colour picked from the name, so each person keeps theirs. */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  const tone = AVATAR_TONES[Array.from(name).reduce((sum, c) => sum + c.charCodeAt(0), 0) % AVATAR_TONES.length]
  const dims = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm'
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${dims} ${tone}`} aria-hidden="true">
      {initials}
    </span>
  )
}

export function EmptyState({
  icon: IconCmp,
  title,
  description,
  action,
}: {
  icon: Icon
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <IconCmp className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && <div className="mt-1 max-w-sm text-sm text-slate-500">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Underlined tab links with optional counts (server-rendered filters). */
export function TabLinks({
  tabs,
  active,
  label,
}: {
  tabs: { key: string; label: string; href: string; count?: number }[]
  active: string
  label: string
}) {
  return (
    <div className="admin-scroll mb-6 overflow-x-auto border-b border-slate-200">
      <nav className="-mb-px flex min-w-max" aria-label={label}>
        {tabs.map((t) => {
          const on = t.key === active
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={on ? 'page' : undefined}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                on ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              {t.label}
              {t.count != null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                    on ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count.toLocaleString('en-IN')}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

/* ---------------------------------- Forms ----------------------------------- */
/** Label + control + hint. Wraps the control in a <label>, so use it for one plain input/select/textarea. */
export function Field({
  label,
  hint,
  required,
  children,
  className = '',
}: {
  label: ReactNode
  hint?: ReactNode
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className={ui.label}>
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className={ui.hint}>{hint}</span>}
    </label>
  )
}

/** On/off switch backed by a native checkbox (`name` is submitted as "on" when checked). */
export function Switch({
  name,
  defaultChecked,
  label,
  description,
  className = '',
}: {
  name: string
  defaultChecked?: boolean
  label: ReactNode
  description?: ReactNode
  className?: string
}) {
  return (
    <label className={`flex cursor-pointer items-start justify-between gap-4 ${className}`}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span
          className="absolute inset-0 rounded-full bg-slate-200 transition peer-checked:bg-blue-900 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-500/20"
          aria-hidden="true"
        />
        <span
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition peer-checked:translate-x-5"
          aria-hidden="true"
        />
      </span>
    </label>
  )
}
