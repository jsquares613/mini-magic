import FeatureForm from '@/components/admin/FeatureForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { createFeature } from '../../actions'

export default function PageFeatureFormNew() {
  return (
    <Page>
      <PageHeader back={{ href: '/admin/play-area', label: 'Play Area' }} title="New feature" description="A reason parents trust the play area." />
      <FeatureForm action={createFeature} />
    </Page>
  )
}
