import Link from 'next/link'

/**
 * Shared homepage section heading. Replaces the six near-identical (but subtly
 * inconsistent) header blocks the rails used to duplicate inline, giving every
 * section the same type scale, the same playful accent bar + emoji, and the
 * same pill-style "View All" affordance. Presentational server component.
 */
type SectionHeaderProps = {
  title: string
  /** Small decorative emoji shown before the title. */
  emoji?: string
  /** Tailwind gradient classes for the accent bar, e.g. "from-amber-400 to-yellow-500". */
  accent?: string
  viewAllHref?: string
  viewAllLabel?: string
}

export default function SectionHeader({
  title,
  emoji,
  accent = 'from-amber-400 to-yellow-500',
  viewAllHref,
  viewAllLabel = 'View All',
}: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 md:mb-10">
      <div>
        <span className={`mb-3 hidden h-1.5 w-12 rounded-full bg-gradient-to-r md:block ${accent}`} />
        <h2 className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-slate-900 md:gap-2.5 md:text-3xl md:font-extrabold lg:text-4xl">
          {emoji && <span aria-hidden="true">{emoji}</span>}
          {title}
        </h2>
      </div>

      {viewAllHref && (
        <>
          {/* Mobile: plain "View All →" link, matching the reference design */}
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500 md:hidden"
          >
            {viewAllLabel}
            <span aria-hidden="true">→</span>
          </Link>

          {/* Desktop: pill button */}
          <Link
            href={viewAllHref}
            className="group hidden shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-700 hover:text-white hover:ring-blue-700 md:inline-flex"
          >
            {viewAllLabel}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </>
      )}
    </div>
  )
}
