import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import HeroSlideForm from '@/components/admin/HeroSlideForm'
import { updateHeroSlide } from '../../actions'

export default async function EditHeroSlidePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: slide } = await supabase.from('homepage_hero_slides').select('*').eq('id', params.id).maybeSingle()
  if (!slide) notFound()

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/homepage" className="text-sm text-blue-600 hover:underline">
        ← Homepage
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">Edit Hero Slide</h1>
      <HeroSlideForm action={updateHeroSlide.bind(null, slide.id)} slide={slide} />
    </div>
  )
}
