import SafeImage from '@/components/SafeImage'
import { isVideo } from '@/lib/media'

export default function OfferBanner({ image }: { image: string }) {
  return (
    <div className="relative mb-6 aspect-[2/1] w-full overflow-hidden rounded-2xl bg-secondary md:aspect-[3/1]">
      {isVideo(image) ? (
        <video src={image} autoPlay muted loop playsInline className="h-full w-full object-cover object-center" />
      ) : (
        <SafeImage src={image} alt="Special offer" priority className="object-cover object-center" />
      )}
    </div>
  )
}
