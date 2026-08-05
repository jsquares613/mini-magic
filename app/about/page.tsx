import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import StatCounter from '@/components/StatCounter'
import SafeImage from '@/components/SafeImage'
import { isVideo } from '@/lib/media'
import { getAboutContent, getAboutGallery, getAboutHero, getAboutSeo, getAboutStatistics, getTeamMembers } from '@/lib/about'

const FALLBACK_TITLE = 'About Us - Minimagic | Our Story, Mission & Team'
const FALLBACK_DESCRIPTION =
  'Learn the story behind Minimagic — a family-run brand making everyday moments magical with safe, joyful and affordable toys, stationery and essentials for every age.'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getAboutSeo()
  const title = seo.title ?? FALLBACK_TITLE
  const description = seo.description ?? FALLBACK_DESCRIPTION
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

const WHY_CHOOSE = [
  { title: 'Safe & Certified', desc: '100% non-toxic, BIS-certified products you can trust.', bg: 'bg-green-50' },
  { title: 'Honest Pricing', desc: 'Premium quality at prices that respect your budget.', bg: 'bg-yellow-50' },
  { title: 'Huge Range', desc: 'Thousands of toys, games & essentials for every age.', bg: 'bg-blue-50' },
  { title: 'Reliable Delivery', desc: 'Fast, careful shipping right across the country.', bg: 'bg-purple-50' },
  { title: 'Caring Support', desc: 'A friendly team that treats you like family.', bg: 'bg-orange-50' },
  { title: 'Loved by Kids', desc: 'Products chosen and approved by the toughest critics.', bg: 'bg-red-50' },
]

const TEAM_FALLBACK_BG = ['bg-blue-100', 'bg-pink-100', 'bg-yellow-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100']

export default async function AboutPage() {
  const [heroSlides, content, statistics, team, gallery] = await Promise.all([
    getAboutHero(),
    getAboutContent(),
    getAboutStatistics(),
    getTeamMembers(),
    getAboutGallery(),
  ])

  const values = [
    { title: 'Our Mission', desc: content.mission, bg: 'bg-yellow-50' },
    { title: 'Our Vision', desc: content.vision, bg: 'bg-blue-50' },
    { title: 'Our Values', desc: content.valuesText, bg: 'bg-pink-50' },
  ]

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFFFEC]">
        {/* 1. Hero — reuses the shared, size-consistent Hero component */}
        <Hero slides={heroSlides} />

        {/* 2. Our Story */}
        <section id="our-story" className="scroll-mt-24 px-4 py-8 md:px-8 md:py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-600">
                Our Story
              </span>
              <h2 className="mb-6 text-4xl font-bold leading-tight text-gray-900">
                {content.storyTitle || (
                  <>
                    Born from a love of <span className="text-orange-500">play</span>
                  </>
                )}
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>{content.story}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-8">
                <div>
                  <p className="text-3xl font-bold text-blue-900">2014</p>
                  <p className="text-sm text-gray-500">Founded</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-900">10+</p>
                  <p className="text-sm text-gray-500">Years of smiles</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-900">100%</p>
                  <p className="text-sm text-gray-500">Family owned</p>
                </div>
              </div>
            </div>

            <div>
              {content.storyImage ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                  <SafeImage
                    src={content.storyImage}
                    alt="The Minimagic story"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-200 to-yellow-100 text-[10rem]">
                  🧸
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Mission & Vision & Values */}
        <section className="bg-blue-950 px-4 py-10 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center md:mb-16">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-yellow-400">Our Foundation</p>
              <h2 className="text-4xl font-bold text-white md:text-5xl">What Drives Us</h2>
              <p className="mx-auto mt-4 max-w-2xl text-blue-300/60">
                The principles that guide every decision we make, from the products we stock to the way we serve you.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: 'Our Mission', desc: content.mission, accent: 'from-yellow-400 to-orange-400', dot: 'bg-yellow-400' },
                { title: 'Our Vision', desc: content.vision, accent: 'from-blue-400 to-cyan-400', dot: 'bg-blue-400' },
                { title: 'Our Values', desc: content.valuesText, accent: 'from-pink-400 to-rose-400', dot: 'bg-pink-400' },
              ].map((v) => (
                <div
                  key={v.title}
                  className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:ring-white/20 hover:shadow-2xl hover:shadow-blue-900"
                >
                  <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${v.accent}`} />
                  <div className={`mb-6 h-2 w-2 rounded-full ${v.dot}`} />
                  <h3 className="mb-4 text-2xl font-bold text-white">{v.title}</h3>
                  <p className="leading-relaxed text-blue-300/70">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Why Choose Us */}
        <section id="why-choose-us" className="scroll-mt-24 px-4 py-10 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center md:mb-16">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-600">Our Difference</p>
              <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">Why Choose Minimagic?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-500">
                Six reasons families keep coming back to us, year after year.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_CHOOSE.map((item, i) => (
                <div
                  key={item.title}
                  className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-blue-100"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-900">
                    <span className="text-sm font-black text-yellow-400">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
                  <div className="absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-yellow-400/10 transition-transform duration-500 group-hover:scale-150 group-hover:bg-yellow-400/20" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Statistics / Achievements */}
        {statistics.length > 0 && (
          <section className="px-4 py-8 md:px-8 md:py-16">
            <div className="mx-auto max-w-7xl">
              <div className="rounded-3xl bg-blue-900 px-6 py-8 md:px-12 md:py-14">
                <h2 className="mb-6 text-center text-3xl font-bold text-white md:mb-12 md:text-4xl">
                  A Decade of Magical Moments
                </h2>
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                  {statistics.map((stat) => (
                    <div key={stat.id} className="text-center">
                      <p className="text-4xl font-bold text-yellow-400 md:text-5xl">
                        {Number.isInteger(stat.value) ? (
                          <StatCounter value={stat.value} suffix={stat.suffix} />
                        ) : (
                          <>
                            {stat.value}
                            {stat.suffix}
                          </>
                        )}
                      </p>
                      <p className="mt-2 text-sm text-blue-100 md:text-base">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 7. Team */}
        {team.length > 0 && (
          <section className="bg-white px-4 py-8 md:px-8 md:py-16">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 text-center md:mb-12">
                <h2 className="text-4xl font-bold text-gray-900">Meet the Team</h2>
                <p className="mx-auto mt-3 max-w-2xl text-gray-600">
                  The friendly faces working hard behind the scenes to bring a little magic to your day.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {team.map((member, index) => (
                  <div
                    key={member.id}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-center transition hover:shadow-lg"
                  >
                    {member.image ? (
                      <div className="relative aspect-square overflow-hidden">
                        <SafeImage
                          src={member.image}
                          alt={member.name}
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    ) : (
                      <div className={`${TEAM_FALLBACK_BG[index % TEAM_FALLBACK_BG.length]} flex aspect-square items-center justify-center`}>
                        <span className="text-7xl transition-transform duration-300 group-hover:scale-110">🧑</span>
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-blue-700">{member.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 8. Gallery / Experience */}
        {gallery.length > 0 && (
          <section className="px-4 py-8 md:px-8 md:py-16">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 text-center md:mb-12">
                <h2 className="text-4xl font-bold text-gray-900">Inside the Minimagic World</h2>
                <p className="mx-auto mt-3 max-w-2xl text-gray-600">
                  A glimpse of the colourful experiences waiting for you in-store and online.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {gallery.map((item, index) => (
                  <div
                    key={`${item.image}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-2xl transition hover:shadow-lg"
                  >
                    {isVideo(item.image) ? (
                      <video
                        src={item.image}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <SafeImage
                        src={item.image}
                        alt={item.label}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    )}
                    {item.label && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
                        {item.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 9. Call to Action */}
        <section className="px-4 pb-10 md:px-8 md:pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl bg-gradient-to-r from-yellow-300 to-yellow-200 px-6 py-14 text-center md:px-12">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Come Find Your Joy</h2>
              <p className="mx-auto mb-8 max-w-2xl text-gray-700">
                Explore our collection, visit the play area, or say hello. There is a little magic here for everyone.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/categories"
                  className="transform rounded-full bg-blue-900 px-8 py-3 font-bold text-white transition hover:scale-105 hover:bg-blue-800"
                >
                  Explore Products
                </Link>
                <Link
                  href="/play-area"
                  className="rounded-full border-2 border-blue-900 px-8 py-3 font-bold text-blue-900 transition hover:bg-blue-900 hover:text-white"
                >
                  Visit Play Area
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
