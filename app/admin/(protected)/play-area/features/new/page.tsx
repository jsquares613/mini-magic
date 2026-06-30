import Link from 'next/link'
import FeatureForm from '@/components/admin/FeatureForm'
import { createFeature } from '../../actions'

export default function NewFeaturePage() {
  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/play-area" className="text-sm text-blue-600 hover:underline">
        ← Play Area
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">New Feature</h1>
      <FeatureForm action={createFeature} />
    </div>
  )
}
