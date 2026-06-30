import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import BannerForm from '@/components/admin/BannerForm'
import { updateBanner } from '../../actions'

export default async function EditBannerPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: banner } = await supabase.from('promotional_banners').select('*').eq('id', params.id).maybeSingle()
  if (!banner) notFound()

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/homepage" className="text-sm text-blue-600 hover:underline">
        ← Homepage
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">Edit Promotional Banner</h1>
      <BannerForm action={updateBanner.bind(null, banner.id)} banner={banner} />
    </div>
  )
}
