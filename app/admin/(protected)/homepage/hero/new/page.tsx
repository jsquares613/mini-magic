import Link from 'next/link'
import HeroSlideForm from '@/components/admin/HeroSlideForm'
import { createHeroSlide } from '../../actions'

export default function NewHeroSlidePage() {
  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/homepage" className="text-sm text-blue-600 hover:underline">
        ← Homepage
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">New Hero Slide</h1>
      <HeroSlideForm action={createHeroSlide} />
    </div>
  )
}
