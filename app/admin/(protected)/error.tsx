'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { buttonClass } from '@/components/admin/ui'
import { AlertTriangleIcon, RefreshIcon } from '@/components/admin/icons'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin error]', error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/60">
          <AlertTriangleIcon className="h-7 w-7" />
        </span>
        <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-500">{error.message || 'An unexpected error occurred while loading this page.'}</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Error ID: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/admin" className={buttonClass('secondary')}>
            Go to dashboard
          </Link>
          <button type="button" onClick={reset} className={buttonClass()}>
            <RefreshIcon className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
