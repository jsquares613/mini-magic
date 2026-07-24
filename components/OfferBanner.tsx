import SafeImage from '@/components/SafeImage'

export default function OfferBanner({ image }: { image: string }) {
  return (
    <div className="relative mb-8 aspect-[3/1] w-full overflow-hidden rounded-2xl bg-secondary">
      <SafeImage src={image} alt="Special offer" priority className="object-cover object-center" />
    </div>
  )
}
