/**
 * Loading skeletons for admin routes (used by `loading.tsx`). Shown instantly
 * on navigation while the server renders the page, so the panel never feels
 * frozen. Server-safe, no client JS.
 */
function Bone({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
}

function CardShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>{children}</div>
}

export default function PageSkeleton({ variant = 'list' }: { variant?: 'list' | 'detail' }) {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8" aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          {variant === 'detail' && <Bone className="h-4 w-24" />}
          <Bone className="h-7 w-56" />
          <Bone className="h-4 w-96 max-w-[80vw]" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-10 w-28" />
          <Bone className="h-10 w-32" />
        </div>
      </div>

      {variant === 'list' ? (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            <Bone className="h-10 w-72" />
            <Bone className="h-10 w-44" />
            <Bone className="h-10 w-36" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-3">
              <Bone className="h-3 w-40" />
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                  <Bone className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Bone className="h-3.5 w-1/3" />
                    <Bone className="h-3 w-1/5" />
                  </div>
                  <Bone className="hidden h-5 w-20 rounded-full sm:block" />
                  <Bone className="hidden h-5 w-16 rounded-full md:block" />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {[0, 1].map((card) => (
              <CardShell key={card}>
                <Bone className="mb-6 h-5 w-40" />
                <div className="space-y-5">
                  <Bone className="h-10 w-full" />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Bone className="h-10 w-full" />
                    <Bone className="h-10 w-full" />
                  </div>
                  <Bone className="h-24 w-full" />
                </div>
              </CardShell>
            ))}
          </div>
          <div className="space-y-6">
            {[0, 1].map((card) => (
              <CardShell key={card}>
                <Bone className="mb-5 h-5 w-28" />
                <Bone className="h-10 w-full" />
              </CardShell>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
