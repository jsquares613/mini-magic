'use client'

import { useEffect, useRef, useState } from 'react'
import { searchPublishedProducts } from '@/app/admin/(protected)/products/actions'
import Select, { type SelectOption } from './Select'

/**
 * Form field for choosing one published product. Searches on the server as
 * you type (20 results at a time) instead of loading the whole catalogue —
 * nothing is fetched until the menu is first opened.
 */
export default function ProductPicker({
  name,
  excludeIds = [],
  placeholder = 'Search products…',
  required = false,
  className,
  'aria-label': ariaLabel,
}: {
  name: string
  /** Products that can't be picked (e.g. already featured / already related). */
  excludeIds?: string[]
  placeholder?: string
  required?: boolean
  className?: string
  'aria-label'?: string
}) {
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState<SelectOption | null>(null)
  const [results, setResults] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState<string | null>(null) // null = never opened
  const latest = useRef(0)
  const excludeKey = excludeIds.join(',')

  // Once the chosen product has been added it appears in excludeIds (after
  // the page refreshes) — clear the field for the next pick.
  useEffect(() => {
    if (value && excludeIds.includes(value)) {
      setValue('')
      setSelected(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeKey])

  useEffect(() => {
    if (query === null) return
    const id = ++latest.current
    setLoading(true)
    const timer = setTimeout(
      async () => {
        try {
          const rows = await searchPublishedProducts(query, excludeIds)
          if (id === latest.current) {
            setResults(rows.map((r) => ({ value: r.id, label: r.name, description: r.marg_code ? `Marg #${r.marg_code}` : undefined })))
          }
        } catch {
          if (id === latest.current) setResults([])
        } finally {
          if (id === latest.current) setLoading(false)
        }
      },
      query ? 250 : 0,
    )
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, excludeKey])

  // Keep the current choice listed even when it isn't in the latest results.
  const options = selected && !results.some((r) => r.value === selected.value) ? [selected, ...results] : results

  return (
    <Select
      name={name}
      required={required}
      className={className}
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={value}
      onChange={(v) => {
        setValue(v)
        setSelected(options.find((o) => o.value === v) ?? null)
      }}
      options={options}
      searchable
      filterLocally={false}
      loading={loading}
      onQueryChange={setQuery}
      emptyText={loading ? 'Searching…' : query ? 'No products found' : 'No published products yet'}
    />
  )
}
