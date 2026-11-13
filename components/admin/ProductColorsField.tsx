'use client'

import { COLOR_PRESETS, MAX_COLORS, isLightSwatch, newColorId, swatchOf, type ProductColor } from '@/lib/productColors'
import { PlusIcon, TrashIcon } from './icons'
import { ui } from './ui'

/**
 * Colour list editor. Controlled - the product form owns the list because its
 * photo sections follow it. Submits the list as JSON in the `colors` field.
 */
export default function ProductColorsField({
  colors,
  onChange,
  photoCounts = {},
}: {
  colors: ProductColor[]
  onChange: (next: ProductColor[]) => void
  /** Photos per colour id, shown beside each colour. */
  photoCounts?: Record<string, number>
}) {
  const names = colors.map((c) => c.name.trim().toLowerCase())
  const duplicate = (i: number) => !!names[i] && names.indexOf(names[i]) !== i
  const full = colors.length >= MAX_COLORS
  const unusedPresets = COLOR_PRESETS.filter((p) => !names.includes(p.name.toLowerCase()))

  function update(i: number, patch: Partial<ProductColor>) {
    onChange(colors.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  }

  function add(name: string, hex: string) {
    if (full) return
    onChange([...colors, { id: newColorId(), name, hex }])
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="colors" value={JSON.stringify(colors.filter((c) => c.name.trim()))} />

      {colors.length > 0 && (
        <ul className="space-y-2">
          {colors.map((c, i) => {
            const swatch = swatchOf(c) ?? '#cbd5e1'
            const count = photoCounts[c.id] ?? 0
            return (
              <li key={c.id} className="flex items-center gap-2">
                <label
                  className={`relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full shadow-sm ring-1 ${
                    isLightSwatch(swatch) ? 'ring-slate-300' : 'ring-slate-900/10'
                  }`}
                  style={{ backgroundColor: swatch }}
                  title="Pick the swatch colour"
                >
                  <input
                    type="color"
                    value={swatch}
                    onChange={(e) => update(i, { hex: e.target.value })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label={`Swatch for ${c.name || 'colour'}`}
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <input
                    value={c.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    placeholder="Colour name, e.g. Sky blue"
                    maxLength={40}
                    aria-label="Colour name"
                    className={`${ui.input} ${duplicate(i) ? '!border-amber-400' : ''}`}
                  />
                  {duplicate(i) && <span className="mt-1 block text-xs text-amber-700">Already added - this one won’t be saved.</span>}
                </div>
                <span className="hidden w-20 shrink-0 text-right text-xs tabular-nums text-slate-500 sm:block">
                  {count} photo{count === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(colors.filter((_, j) => j !== i))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Remove ${c.name || 'colour'}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">{colors.length ? 'Add another' : 'Quick add'}</p>
        <div className="flex flex-wrap gap-1.5">
          {unusedPresets.map((p) => (
            <button
              key={p.name}
              type="button"
              disabled={full}
              onClick={() => add(p.name, p.hex)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
            >
              <span
                className={`h-4 w-4 rounded-full ring-1 ${isLightSwatch(p.hex) ? 'ring-slate-300' : 'ring-black/10'}`}
                style={{ backgroundColor: p.hex }}
              />
              {p.name}
            </button>
          ))}
          <button
            type="button"
            disabled={full}
            onClick={() => add('', '#3b82f6')}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-700 disabled:opacity-50"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Custom colour
          </button>
        </div>
        {full && <p className={ui.hint}>Up to {MAX_COLORS} colours per product.</p>}
      </div>
    </div>
  )
}
