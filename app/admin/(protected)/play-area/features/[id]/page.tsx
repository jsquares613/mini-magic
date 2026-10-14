import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import FeatureForm from '@/components/admin/FeatureForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { updateFeature } from '../../actions'

export default async function PageFeatureFormEdit({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: feature } = await supabase.from('play_area_features').select('*').eq('id', params.id).maybeSingle()
  if (!feature) notFound()

  return (
    <Page>
      <PageHeader back={{ href: '/admin/play-area', label: 'Play Area' }} title="Edit feature" description="A reason parents trust the play area." />
      <FeatureForm action={updateFeature.bind(null, feature.id)} feature={feature} />
    </Page>
  )
}
