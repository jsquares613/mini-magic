'use client'

import { useEffect } from 'react'

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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="text-5xl">⚠️</div>
      <div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mb-1 max-w-md text-sm text-gray-600">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  )
}
