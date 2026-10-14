'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckIcon, ChevronDownIcon, SearchIcon } from './icons'

export interface SelectOption {
  value: string
  label: string
  /** Second line under the label in the menu. */
  description?: string
  /** Right-aligned muted text, e.g. a count. */
  meta?: string
  /** Leading visual (dot, icon, emoji) — shown in the menu and on the button. */
  icon?: ReactNode
  disabled?: boolean
}

interface MenuPosition {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

const MENU_MAX_HEIGHT = 320
const MENU_MIN_WIDTH = 200
const GAP = 6

// useLayoutEffect warns during SSR; positioning only matters in the browser.
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function filterOptions(options: SelectOption[], query: string): SelectOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return options
  return options.filter((o) => `${o.label} ${o.description ?? ''} ${o.meta ?? ''}`.toLowerCase().includes(q))
}

function firstEnabled(options: SelectOption[]): number {
  return options.findIndex((o) => !o.disabled)
}

/**
 * Custom dropdown for the admin — a styled replacement for `<select>`.
 *
 * Works in forms like a native select: with `name` the value is submitted via
 * a hidden input, and `required` blocks submission until something is picked.
 * Use `value`/`onChange` for controlled filters. The menu renders in a portal
 * (so cards with `overflow: hidden` can't clip it), flips above the button
 * when there's no room below, gets a search box for longer lists, and
 * supports the usual keys (arrows, Home/End, Enter, Escape, type-ahead).
 */
export default function Select({
  options,
  name,
  value,
  defaultValue = '',
  onChange,
  placeholder = 'Select…',
  searchable = 'auto',
  required = false,
  disabled = false,
  className = 'w-full',
  'aria-label': ariaLabel,
}: {
  options: SelectOption[]
  /** Form field name — submits the value through a hidden input. */
  name?: string
  /** Controlled value (pair with `onChange`). */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  /** Search box in the menu; 'auto' shows it for lists longer than eight. */
  searchable?: boolean | 'auto'
  required?: boolean
  disabled?: boolean
  /** Layout classes for the control (width, flex) — defaults to full width. */
  className?: string
  'aria-label'?: string
}) {
  const uid = useId()
  const listboxId = `${uid}-listbox`
  const optionId = useCallback((i: number) => `${uid}-option-${i}`, [uid])

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [inner, setInner] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(-1)
  const [invalid, setInvalid] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)

  const raw = value !== undefined ? value : inner
  // A value that's no longer offered (e.g. a subcategory of another category) counts as empty.
  const current = options.some((o) => o.value === raw) ? raw : ''
  const selected = options.find((o) => o.value === current)
  const isSearchable = searchable === 'auto' ? options.length > 8 : searchable
  const filtered = filterOptions(options, query)

  const place = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const below = vh - r.bottom - GAP - 8
    const above = r.top - GAP - 8
    const up = below < 220 && above > below
    const maxHeight = Math.max(140, Math.min(MENU_MAX_HEIGHT, up ? above : below))
    const width = Math.min(Math.max(r.width, MENU_MIN_WIDTH), vw - 16)
    const left = Math.max(8, Math.min(r.left, vw - width - 8))
    setPosition(up ? { bottom: vh - r.top + GAP, left, width, maxHeight } : { top: r.bottom + GAP, left, width, maxHeight })
  }, [])

  function openMenu() {
    if (disabled) return
    setQuery('')
    const idx = options.findIndex((o) => o.value === current && !o.disabled)
    setActive(idx >= 0 ? idx : firstEnabled(options))
    setOpen(true)
  }

  function closeMenu(focusTrigger = true) {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }

  function choose(option: SelectOption) {
    if (option.disabled) return
    if (value === undefined) setInner(option.value)
    setInvalid(false)
    closeMenu()
    if (option.value !== current) onChange?.(option.value)
  }

  useBrowserLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place])

  // The menu mounts only once it has a position — focus and scroll after that render.
  const menuReady = open && position !== null
  useEffect(() => {
    if (menuReady) (searchRef.current ?? listRef.current)?.focus({ preventScroll: true })
  }, [menuReady])

  useEffect(() => {
    if (menuReady && active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' })
  }, [menuReady, active, optionId])

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      if (!open) openMenu()
    }
  }

  /** Next enabled index from `from` in direction `dir`, wrapping around. */
  function step(from: number, dir: 1 | -1): number {
    const count = filtered.length
    for (let i = 1; i <= count; i++) {
      const idx = (((from + dir * i) % count) + count) % count
      if (!filtered[idx].disabled) return idx
    }
    return -1
  }

  function onMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const count = filtered.length
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (count) setActive((a) => step(a < 0 ? -1 : a, 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (count) setActive((a) => step(a < 0 ? count : a, -1))
        break
      case 'Home':
      case 'End':
        if (!isSearchable && count) {
          e.preventDefault()
          setActive(e.key === 'Home' ? step(-1, 1) : step(count, -1))
        }
        break
      case 'Enter':
        e.preventDefault()
        if (active >= 0 && filtered[active]) choose(filtered[active])
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        closeMenu()
        break
      case 'Tab':
        e.preventDefault()
        closeMenu()
        break
      default:
        // Type-ahead: jump to the next option starting with the typed letter.
        if (!isSearchable && count && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const ch = e.key.toLowerCase()
          for (let i = 1; i <= count; i++) {
            const idx = (Math.max(active, -1) + i) % count
            if (!filtered[idx].disabled && filtered[idx].label.toLowerCase().startsWith(ch)) {
              setActive(idx)
              break
            }
          }
        }
    }
  }

  const portalTarget = typeof document === 'undefined' ? null : document.getElementById('admin-portal') ?? document.body

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={`flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border bg-white px-3 text-left text-sm shadow-sm transition focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
          invalid
            ? 'border-rose-400 ring-4 ring-rose-500/10'
            : open
              ? 'border-blue-500 ring-4 ring-blue-500/10'
              : 'border-slate-300 hover:border-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10'
        }`}
      >
        {selected?.icon && <span className="flex shrink-0 items-center">{selected.icon}</span>}
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {name && <input type="hidden" name={name} value={current} />}
      {required && (
        // Native validation proxy: hidden inputs can't be `required`, so an
        // invisible text input carries the constraint (and the browser's bubble).
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={current}
          onChange={() => {}}
          onInvalid={() => setInvalid(true)}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      )}

      {open &&
        position &&
        portalTarget &&
        createPortal(
          <div
            ref={menuRef}
            onKeyDown={onMenuKeyDown}
            className="admin-pop fixed z-[70] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5"
            style={{ top: position.top, bottom: position.bottom, left: position.left, width: position.width, maxHeight: position.maxHeight }}
          >
            {isSearchable && (
              <div className="shrink-0 border-b border-slate-100 p-2">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setActive(firstEnabled(filterOptions(options, e.target.value)))
                    }}
                    placeholder="Search…"
                    aria-label="Search options"
                    aria-controls={listboxId}
                    aria-activedescendant={active >= 0 ? optionId(active) : undefined}
                    className="h-9 w-full rounded-lg border-0 bg-slate-50 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              aria-label={ariaLabel}
              aria-activedescendant={!isSearchable && active >= 0 ? optionId(active) : undefined}
              className="admin-scroll min-h-0 flex-1 overflow-y-auto p-1.5 focus:outline-none"
            >
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500">No matches</p>
              ) : (
                filtered.map((o, i) => {
                  const isSelected = o.value === current
                  return (
                    <div
                      key={`${o.value}-${i}`}
                      id={optionId(i)}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={o.disabled || undefined}
                      onMouseEnter={() => !o.disabled && setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(o)}
                      className={`flex select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                        o.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      } ${i === active ? 'bg-slate-100' : ''} ${isSelected ? 'font-medium text-blue-900' : 'text-slate-700'}`}
                    >
                      {o.icon && <span className="flex shrink-0 items-center">{o.icon}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{o.label}</span>
                        {o.description && <span className="block truncate text-xs font-normal text-slate-500">{o.description}</span>}
                      </span>
                      {o.meta && <span className="shrink-0 text-xs tabular-nums text-slate-400">{o.meta}</span>}
                      <CheckIcon className={`h-4 w-4 shrink-0 text-blue-900 ${isSelected ? '' : 'invisible'}`} />
                    </div>
                  )
                })
              )}
            </div>
          </div>,
          portalTarget,
        )}
    </div>
  )
}
