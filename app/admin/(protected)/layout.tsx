import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { requireStaff } from '@/lib/supabase/auth'
import Sidebar from '@/components/admin/Sidebar'
import NavigationProgress from '@/components/admin/NavigationProgress'

export const metadata: Metadata = {
  title: 'Admin — Minimagic',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Guards every protected admin route (redirects if not signed-in / not staff).
  const profile = await requireStaff()

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Reads search params, so it gets its own boundary instead of suspending the shell. */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Sidebar email={profile.email} role={profile.role} />
      {/* overflow-x-clip (not hidden) keeps wide content contained without
          breaking `position: sticky` (form save bars) inside the page. */}
      <main className="min-w-0 flex-1 overflow-x-clip pt-14 md:pt-0">
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </main>
      <Toaster richColors position="top-right" closeButton />
    </div>
  )
}
