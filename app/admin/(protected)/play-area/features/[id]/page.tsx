import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import FeatureForm from '@/components/admin/FeatureForm'
import { updateFeature } from '../../actions'

export default async function EditFeaturePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: feature } = await supabase.from('play_area_features').select('*').eq('id', params.id).maybeSingle()
  if (!feature) notFound()

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/play-area" className="text-sm text-blue-600 hover:underline">
        ← Play Area
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">Edit Feature</h1>
      <FeatureForm action={updateFeature.bind(null, feature.id)} feature={feature} />
    </div>
  )
}
