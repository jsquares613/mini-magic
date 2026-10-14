import HeroSlideForm from '@/components/admin/HeroSlideForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { createHeroSlide } from '../../actions'

export default function PageHeroSlideFormNew() {
  return (
    <Page>
      <PageHeader back={{ href: '/admin/homepage', label: 'Homepage' }} title="New hero slide" description="A large banner in the homepage carousel." />
      <HeroSlideForm action={createHeroSlide} />
    </Page>
  )
}
