import BannerForm from '@/components/admin/BannerForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { createBanner } from '../../actions'

export default function PageBannerFormNew() {
  return (
    <Page>
      <PageHeader back={{ href: '/admin/homepage', label: 'Homepage' }} title="New promotional banner" description="An offer block on the homepage." />
      <BannerForm action={createBanner} />
    </Page>
  )
}
