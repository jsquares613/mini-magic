import { createServerSupabase } from '@/lib/supabase/server'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import MediaUploadField from '@/components/admin/MediaUploadField'
import { Card, FormActions, Page, PageHeader, Switch, buttonClass } from '@/components/admin/ui'
import { ExternalLinkIcon, EyeIcon, ImagesIcon } from '@/components/admin/icons'
import { updateOfferBanner } from './actions'

export default async function OffersAdminPage() {
  const supabase = createServerSupabase()
  const { data: banner } = await supabase.from('offer_banner').select('*').eq('id', 1).maybeSingle()

  return (
    <Page>
      <PageHeader
        title="Offers page"
        description="The banner at the top of the Offers page. Sale prices and promo tags are set on each product."
        actions={
          <a href="/offers" target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
            <ExternalLinkIcon className="h-4 w-4" />
            View offers page
          </a>
        }
      />

      <ActionForm action={updateOfferBanner} successMessage="Offer banner saved successfully">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" title="Hero banner" description="Shown full-width at the top of the page." icon={ImagesIcon} tone="violet">
            <MediaUploadField
              bucket="banners"
              name="image"
              label="Banner media"
              defaultUrl={banner?.image ?? null}
              aspectRatio={3}
              hint="1280 × 427 px (3:1) — image or MP4 video"
            />
          </Card>
          <Card title="Visibility" icon={EyeIcon}>
            <Switch name="active" defaultChecked={banner?.active ?? true} label="Show banner" description="Display it at the top of the Offers page." />
          </Card>
        </div>

        <FormActions>
          <SubmitButton pendingText="Saving…" size="lg">
            Save banner
          </SubmitButton>
        </FormActions>
      </ActionForm>
    </Page>
  )
}
