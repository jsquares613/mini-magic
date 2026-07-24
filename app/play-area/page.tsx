import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import EnquiryButton from '@/components/EnquiryButton'
import SafeImage from '@/components/SafeImage'
import {
  getPlayAreaHero,
  getPlayFeatures,
  getPlayRules,
  getPlaySeo,
  getPlayZones,
} from '@/lib/playArea'

const FALLBACK_TITLE = 'Play Area - Minimagic | Indoor Playground for Kids'
const FALLBACK_DESCRIPTION =
  'Visit the Minimagic Play Area — a safe, supervised indoor playground with ball pits, slides, climbing zones and arts & crafts for kids of every age.'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPlaySeo()
  const title = seo.title ?? FALLBACK_TITLE
  const description = seo.description ?? FALLBACK_DESCRIPTION
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function PlayAreaPage() {
  const [heroSlides, playZones, playFeatures, playRules] = await Promise.all([
    getPlayAreaHero(),
    getPlayZones(),
    getPlayFeatures(),
    getPlayRules(),
  ])

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFFFEC]">
        {/* Reusable hero — identical sizing/behaviour to the homepage */}
        <Hero slides={heroSlides} />

        {/* CTA */}
        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl bg-blue-900 px-6 py-14 text-center text-white md:px-12">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready for a Day of Magic?</h2>
              <p className="mx-auto mb-8 max-w-2xl text-blue-100">
                Bring the kids down for hours of safe, supervised fun — or book the whole zone for an unforgettable birthday party.
              </p>

              <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { price: '₹29', duration: '20 min' },
                  { price: '₹49', duration: '40 min' },
                  { price: '₹69', duration: '1 hr' },
                ].map((tier) => (
                  <div
                    key={tier.duration}
                    className="rounded-2xl border border-white/20 bg-white/10 px-4 py-5"
                  >
                    <p className="text-2xl font-bold text-yellow-400">{tier.price}</p>
                    <p className="text-sm text-blue-100">{tier.duration}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <EnquiryButton
                  subject="Play Area Visit"
                  source="play-area"
                  label="Book a Visit"
                  className="inline-flex items-center justify-center rounded-full bg-yellow-500 px-8 py-3 font-bold text-white transition hover:scale-105 hover:bg-yellow-600"
                />
                <Link
                  href="/categories"
                  className="rounded-full border border-white/40 px-8 py-3 font-bold text-white transition hover:bg-white/10"
                >
                  Shop Toys
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Play Zones */}
        <section id="play-zones" className="scroll-mt-24 px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-bold text-gray-900">Our Play Zones</h2>
              <p className="mx-auto mt-3 max-w-2xl text-gray-600">
                Six imaginative zones designed to keep kids active, curious and smiling — all under one safe roof.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {playZones.map((zone) => (
                <div
                  key={zone.id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-lg"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <SafeImage
                      src={zone.image}
                      alt={zone.name}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 text-xl font-bold text-gray-900">{zone.name}</h3>
                    <p className="text-sm leading-relaxed text-gray-600">{zone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Parents Trust Us */}
        <section className="bg-white px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">Why Parents Trust Us</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {playFeatures.map((f) => (
                <div
                  key={f.title}
                  className={`${f.bgColor} rounded-lg border-2 border-gray-200 p-8 text-center transition hover:shadow-lg`}
                >
                  <h3 className="mb-3 text-xl font-bold text-gray-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* House Rules */}
        {playRules.length > 0 && (
          <section id="rules" className="scroll-mt-24 px-4 py-16 md:px-8">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-8 text-center text-4xl font-bold text-gray-900">House Rules</h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {playRules.map((rule) => (
                  <li key={rule} className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-center">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm text-gray-700">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  )
}
