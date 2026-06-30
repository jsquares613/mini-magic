import Link from 'next/link'
import BannerForm from '@/components/admin/BannerForm'
import { createBanner } from '../../actions'

export default function NewBannerPage() {
  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/homepage" className="text-sm text-blue-600 hover:underline">
        ← Homepage
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">New Promotional Banner</h1>
      <BannerForm action={createBanner} />
    </div>
  )
}
