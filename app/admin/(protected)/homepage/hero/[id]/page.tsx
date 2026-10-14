import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import HeroSlideForm from '@/components/admin/HeroSlideForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { updateHeroSlide } from '../../actions'

export default async function PageHeroSlideFormEdit({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: slide } = await supabase.from('homepage_hero_slides').select('*').eq('id', params.id).maybeSingle()
  if (!slide) notFound()

  return (
    <Page>
      <PageHeader back={{ href: '/admin/homepage', label: 'Homepage' }} title="Edit hero slide" description="A large banner in the homepage carousel." />
      <HeroSlideForm action={updateHeroSlide.bind(null, slide.id)} slide={slide} />
    </Page>
  )
}
