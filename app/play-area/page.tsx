import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import EnquiryButton from '@/components/EnquiryButton'
import SafeImage from '@/components/SafeImage'
import { isVideo } from '@/lib/media'
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
        <section className="px-4 py-8 md:px-8 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl bg-blue-900 px-6 py-8 text-center text-white md:px-12 md:py-14">
              <h2 className="mb-3 text-2xl font-bold md:mb-4 md:text-4xl">Ready for a Day of Magic?</h2>
              <p className="mx-auto mb-5 max-w-2xl text-blue-100 md:mb-8">
                Bring the kids down for hours of safe, supervised fun - or book the whole zone for an unforgettable birthday party.
              </p>

              <div className="mx-auto mb-5 grid max-w-2xl grid-cols-3 gap-3 md:mb-8 md:gap-4">
                {[
                  { price: '₹29', duration: '20 min' },
                  { price: '₹49', duration: '40 min' },
                  { price: '₹69', duration: '1 hr' },
                ].map((tier) => (
                  <div
                    key={tier.duration}
                    className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 md:px-4 md:py-5"
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
        <section id="play-zones" className="scroll-mt-24 bg-gray-50 px-4 py-10 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center md:mb-16">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Explore</p>
              <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">Our Play Zones</h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-500">
                Six imaginative zones designed to keep kids active, curious and smiling, all under one safe roof.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {playZones.map((zone, i) => (
                <div
                  key={zone.id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-yellow-300 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                    {isVideo(zone.image) ? (
                      <video
                        src={zone.image}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : zone.image ? (
                      <SafeImage
                        src={zone.image}
                        alt={zone.name}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-yellow-50 to-amber-100" />
                    )}
                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[11px] font-black text-gray-900 shadow-md">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="mb-3 h-[2px] w-8 rounded-full bg-yellow-400" />
                    <h3 className="mb-2 text-lg font-bold text-gray-900">{zone.name}</h3>
                    <p className="text-sm leading-relaxed text-gray-500">{zone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Parents Trust Us */}
        <section className="bg-white px-4 py-10 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center md:mb-14">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Safety First</p>
              <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">Why Parents Trust Us</h2>
              <p className="mx-auto mt-4 max-w-xl text-gray-500">
                Every corner of our space is built around one goal: the safety and happiness of your child.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {playFeatures.map((f, i) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-gray-100 bg-gray-50 p-7 transition duration-300 hover:-translate-y-1 hover:border-yellow-200 hover:bg-yellow-50 hover:shadow-md"
                >
                  <p className="mb-4 text-5xl font-black leading-none text-gray-200 transition duration-300 group-hover:text-yellow-300">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mb-2 text-base font-bold text-gray-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* House Rules */}
        {playRules.length > 0 && (
          <section id="rules" className="scroll-mt-24 bg-gray-50 px-4 py-10 md:px-8 md:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 text-center md:mb-12">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Guidelines</p>
                <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">House Rules</h2>
                <p className="mx-auto mt-4 max-w-xl text-gray-500">
                  A few simple rules that keep our space safe, joyful and welcoming for every child.
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {playRules.map((rule, i) => (
                  <li
                    key={rule}
                    className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition duration-200 hover:border-yellow-300 hover:shadow-md"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-[11px] font-black text-gray-900">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{rule}</span>
                    <svg className="ml-auto h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
