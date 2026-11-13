'use client'

import type { ReactNode } from 'react'
import { isLightSwatch, swatchOf, type ProductColor } from '@/lib/productColors'
import { UploadIcon } from './icons'

/**
 * Pieces shared by the create form's staged photos and the edit page's
 * ImageManager: photos are grouped into "General" (shown for every colour)
 * plus one group per product colour, each with its own add tile.
 */

export function ColorDot({ color, className = 'h-3.5 w-3.5' }: { color: Pick<ProductColor, 'name' | 'hex'>; className?: string }) {
  const swatch = swatchOf(color)
  return (
    <span
      className={`inline-block shrink-0 rounded-full ring-1 ${isLightSwatch(swatch) ? 'ring-slate-300' : 'ring-black/10'} ${className}`}
      style={{ backgroundColor: swatch ?? '#e2e8f0' }}
      aria-hidden="true"
    />
  )
}

/** Groups to show: general first, then each named colour. */
export function photoGroups(colors: ProductColor[]): { colorId: string | null; color?: ProductColor }[] {
  return [{ colorId: null }, ...colors.filter((c) => c.name.trim()).map((c) => ({ colorId: c.id, color: c }))]
}

export function PhotoGroup({
  color,
  showHeading,
  count,
  children,
  onAddFiles,
  disabled,
  addLabel = 'Add photos',
  note,
}: {
  color?: ProductColor
  /** Headings only make sense once the product has colours. */
  showHeading: boolean
  count: number
  children: ReactNode
  onAddFiles: (files: File[]) => void
  disabled?: boolean
  addLabel?: ReactNode
  note?: ReactNode
}) {
  return (
    <div>
      {showHeading && (
        <div className="mb-2 flex items-center gap-2">
          {color && <ColorDot color={color} />}
          <h3 className="text-sm font-semibold text-slate-800">{color ? color.name : 'General photos'}</h3>
          <span className="text-xs text-slate-400">
            {color ? `${count} photo${count === 1 ? '' : 's'} · shown when “${color.name}” is picked` : 'Shown for every colour'}
          </span>
        </div>
      )}
      {note}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
        {children}
        <label
          className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-2 text-center text-xs font-medium text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700 ${
            disabled ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <UploadIcon className="h-5 w-5" />
          {addLabel}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={disabled}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              e.target.value = ''
              if (files.length) onAddFiles(files)
            }}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}

/** Small "move to colour" picker on a photo tile. */
export function PhotoColorSelect({
  colors,
  value,
  onChange,
  disabled,
}: {
  colors: ProductColor[]
  value: string | null
  onChange: (colorId: string | null) => void
  disabled?: boolean
}) {
  const named = colors.filter((c) => c.name.trim())
  if (named.length === 0) return null
  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Photo colour"
      title="Which colour this photo shows"
      className="w-full min-w-0 rounded-md border-0 bg-white/90 px-1.5 py-1 text-[11px] font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
    >
      <option value="">All colours</option>
      {named.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
