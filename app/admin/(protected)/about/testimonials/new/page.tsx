import TestimonialForm from '@/components/admin/TestimonialForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { createTestimonial } from '../../actions'

export default function PageTestimonialFormNew() {
  return (
    <Page>
      <PageHeader back={{ href: '/admin/about', label: 'About Us' }} title="New testimonial" description="A quote from a happy customer." />
      <TestimonialForm action={createTestimonial} />
    </Page>
  )
}
