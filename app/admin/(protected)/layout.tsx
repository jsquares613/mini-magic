import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { requireStaff } from '@/lib/supabase/auth'
import Sidebar from '@/components/admin/Sidebar'

export const metadata: Metadata = {
  title: 'Admin — Minimagic',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Guards every protected admin route (redirects if not signed-in / not staff).
  const profile = await requireStaff()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar email={profile.email} role={profile.role} />
      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">{children}</main>
      <Toaster richColors position="top-right" closeButton />
    </div>
  )
}
