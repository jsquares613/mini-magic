import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import EnquiryButton from '@/components/EnquiryButton'
import { getContactInfo } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Contact Us - Minimagic',
  description: 'Get in touch with the Minimagic team — questions, enquiries, play-area bookings and more.',
}

export default async function ContactPage() {
  const contact = await getContactInfo()

  type ContactCard = { icon: string; title: string; value: string; href?: string }
  const candidates: (ContactCard | false | undefined)[] = [
    contact?.phone && { icon: '📱', title: 'Call Us', value: contact.phone, href: `tel:${contact.phone}` },
    contact?.email && { icon: '✉️', title: 'Email Us', value: contact.email, href: `mailto:${contact.email}` },
    contact?.address && { icon: '📍', title: 'Visit Us', value: contact.address },
  ]
  const cards = candidates.filter((c): c is ContactCard => Boolean(c))

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFFEC]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          <nav className="mb-3 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-900">Home</Link>{' '}
            <span className="mx-2">›</span> <span className="font-semibold">Contact</span>
          </nav>

          <h1 className="mb-3 text-4xl font-bold md:text-5xl">
            Get in <span className="text-orange-500">Touch</span>
          </h1>
          <p className="mb-10 max-w-xl text-gray-600">
            Have a question, want to book a play-area visit, or planning a party? We would love to hear from you.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {cards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <div className="mb-3 text-5xl">{card.icon}</div>
                <h2 className="mb-2 text-lg font-bold text-gray-900">{card.title}</h2>
                {card.href ? (
                  <a href={card.href} className="font-semibold text-blue-700 hover:text-blue-900">
                    {card.value}
                  </a>
                ) : (
                  <p className="font-semibold text-gray-700">{card.value}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl bg-gradient-to-r from-yellow-300 to-yellow-200 px-6 py-12 text-center md:px-12">
            <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">Send Us a Message</h2>
            <p className="mx-auto mb-6 max-w-xl text-gray-700">
              Fill in a quick enquiry and our team will get back to you as soon as possible.
            </p>
            <EnquiryButton subject="General Enquiry" source="contact" label="Send a Message" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
