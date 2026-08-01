import { createServerSupabase } from '@/lib/supabase/server'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import MediaUploadField from '@/components/admin/MediaUploadField'
import { updateOfferBanner } from './actions'

export default async function OffersAdminPage() {
  const supabase = createServerSupabase()
  const { data: banner } = await supabase.from('offer_banner').select('*').eq('id', 1).maybeSingle()

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Offers Page</h1>

      <ActionForm action={updateOfferBanner} successMessage="Offer banner saved successfully" className="max-w-2xl">
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-bold text-gray-900">Hero Banner</h2>
          <p className="text-sm text-gray-500">Media shown at the top of the Offers page.</p>

          <MediaUploadField
            bucket="banners"
            name="image"
            label="Banner media (image or video)"
            defaultUrl={banner?.image ?? null}
            aspectRatio={3}
            hint="1280 × 427px (3:1) — image or MP4 video"
          />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked={banner?.active ?? true} /> Show banner on Offers page
          </label>

          <SubmitButton pendingText="Saving…" className="px-6 py-3">
            Save banner
          </SubmitButton>
        </section>
      </ActionForm>
    </div>
  )
}
