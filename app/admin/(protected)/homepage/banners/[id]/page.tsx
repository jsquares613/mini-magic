import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import BannerForm from '@/components/admin/BannerForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { updateBanner } from '../../actions'

export default async function PageBannerFormEdit({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: banner } = await supabase.from('promotional_banners').select('*').eq('id', params.id).maybeSingle()
  if (!banner) notFound()

  return (
    <Page>
      <PageHeader back={{ href: '/admin/homepage', label: 'Homepage' }} title="Edit promotional banner" description="An offer block on the homepage." />
      <BannerForm action={updateBanner.bind(null, banner.id)} banner={banner} />
    </Page>
  )
}
