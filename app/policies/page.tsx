import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getContactInfo } from '@/lib/settings'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Policies - Minimagic | Privacy, Terms & Cookies',
  description: 'Read the Minimagic privacy policy, terms of service and cookie policy.',
}

const SECTIONS = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: [
      'We respect your privacy. Any details you share through enquiry or contact forms (name, email, phone) are used only to respond to your request and are never sold to third parties.',
      'We retain enquiry information only as long as needed to assist you, and you may request its deletion at any time by contacting us.',
    ],
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    body: [
      'All product information, pricing and availability shown on this website are for general information and may change without notice.',
      'Placing an enquiry does not constitute a binding order. Our team will confirm availability and pricing before any purchase is finalised.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    body: [
      'This site uses essential cookies to function correctly. We may use anonymous analytics cookies to understand how visitors use the site and improve their experience.',
      'You can control or disable cookies through your browser settings at any time.',
    ],
  },
]

export default async function PoliciesPage() {
  const contact = await getContactInfo()
  const email = contact?.email ?? siteConfig.contact.email

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFFEC]">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
          <nav className="mb-3 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-900">Home</Link>{' '}
            <span className="mx-2">›</span> <span className="font-semibold">Policies</span>
          </nav>
          <h1 className="mb-8 text-4xl font-bold">Our Policies</h1>

          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">{section.title}</h2>
                <div className="space-y-3 text-gray-600">
                  {section.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 text-sm text-gray-500">
            Questions about these policies? Email us at{' '}
            <a href={`mailto:${email}`} className="font-semibold text-blue-700 hover:text-blue-900">
              {email}
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
