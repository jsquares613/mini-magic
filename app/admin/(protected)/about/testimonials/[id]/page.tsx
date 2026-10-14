import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import TestimonialForm from '@/components/admin/TestimonialForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { updateTestimonial } from '../../actions'

export default async function PageTestimonialFormEdit({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: testimonial } = await supabase.from('testimonials').select('*').eq('id', params.id).maybeSingle()
  if (!testimonial) notFound()

  return (
    <Page>
      <PageHeader back={{ href: '/admin/about', label: 'About Us' }} title="Edit testimonial" description="A quote from a happy customer." />
      <TestimonialForm action={updateTestimonial.bind(null, testimonial.id)} testimonial={testimonial} />
    </Page>
  )
}
