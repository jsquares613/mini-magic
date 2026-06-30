import Link from 'next/link'
import TestimonialForm from '@/components/admin/TestimonialForm'
import { createTestimonial } from '../../actions'

export default function NewTestimonialPage() {
  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/about" className="text-sm text-blue-600 hover:underline">
        ← About Us
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">New Testimonial</h1>
      <TestimonialForm action={createTestimonial} />
    </div>
  )
}
