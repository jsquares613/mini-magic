import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import TestimonialForm from '@/components/admin/TestimonialForm'
import { updateTestimonial } from '../../actions'

export default async function EditTestimonialPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: testimonial } = await supabase.from('testimonials').select('*').eq('id', params.id).maybeSingle()
  if (!testimonial) notFound()

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/about" className="text-sm text-blue-600 hover:underline">
        ← About Us
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">Edit Testimonial</h1>
      <TestimonialForm action={updateTestimonial.bind(null, testimonial.id)} testimonial={testimonial} />
    </div>
  )
}
