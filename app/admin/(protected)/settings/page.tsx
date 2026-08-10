import { createServerSupabase } from '@/lib/supabase/server'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { updateContactInfo, updateFooterText, updateBannerSettings } from './actions'
import { siteConfig } from '@/config/site'

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

export default async function SettingsPage() {
  const supabase = createServerSupabase()
  const [{ data: contact }, { data: footerSetting }, { data: marqueeSetting }, { data: announcementsSetting }] = await Promise.all([
    supabase.from('contact_information').select('*').eq('id', 1).maybeSingle(),
    supabase.from('site_settings').select('value').eq('key', 'footer_text').maybeSingle(),
    supabase.from('site_settings').select('value').eq('key', 'marquee_enabled').maybeSingle(),
    supabase.from('site_settings').select('value').eq('key', 'announcements').maybeSingle(),
  ])
  const footerText = (footerSetting?.value as string) ?? ''
  const marqueeEnabled = marqueeSetting ? (marqueeSetting.value as boolean) : true
  const announcements: string[] = (announcementsSetting?.value as string[]) ?? siteConfig.announcements

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Scrolling Banner */}
      <ActionForm action={updateBannerSettings} successMessage="Banner updated successfully">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 font-bold text-gray-900">Scrolling Banner</h2>
          <p className="mb-5 text-sm text-gray-500">
            The announcement bar shown at the top of every page. Add, remove, or edit messages — one per line.
          </p>

          <div className="space-y-5">
            <div>
              <label className={label}>Messages <span className="text-gray-400">(one per line)</span></label>
              <textarea
                name="messages"
                rows={5}
                defaultValue={announcements.join('\n')}
                placeholder={'Special Weekend Offers Available In-Store\nNew Arrivals Just Landed\nBirthday Gift Collections Available'}
                className={input}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  name="marquee_enabled"
                  defaultChecked={marqueeEnabled}
                  className="sr-only peer"
                />
                <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">Enable scrolling animation</span>
            </label>
          </div>

          <div className="mt-6">
            <SubmitButton pendingText="Saving…" className="px-6 py-2.5">
              Save Banner
            </SubmitButton>
          </div>
        </section>
      </ActionForm>

      {/* Footer Text */}
      <ActionForm action={updateFooterText} successMessage="Footer text saved successfully">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 font-bold text-gray-900">Footer Tagline</h2>
          <p className="mb-5 text-sm text-gray-500">
            The tagline shown below the brand name in the footer. Defaults to{' '}
            <span className="italic text-gray-400">&ldquo;{siteConfig.tagline}&rdquo;</span> when left blank.
          </p>
          <div className="space-y-4">
            <div>
              <label className={label}>Tagline text</label>
              <input
                name="footer_text"
                placeholder={siteConfig.tagline}
                defaultValue={footerText}
                className={input}
              />
            </div>
          </div>
          <div className="mt-6">
            <SubmitButton pendingText="Saving…" className="px-6 py-2.5">
              Save Tagline
            </SubmitButton>
          </div>
        </section>
      </ActionForm>

      {/* Contact Information */}
      <ActionForm action={updateContactInfo} successMessage="Contact information saved successfully">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 font-bold text-gray-900">Contact Information</h2>
          <p className="mb-5 text-sm text-gray-500">
            Shown in the footer and on the Contact page. Leave a field blank to hide it.
          </p>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Phone</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+91 72594 07351"
                  defaultValue={contact?.phone ?? ''}
                  className={input}
                />
              </div>
              <div>
                <label className={label}>WhatsApp number</label>
                <input
                  name="whatsapp"
                  type="tel"
                  placeholder="+917259407351"
                  defaultValue={contact?.whatsapp ?? ''}
                  className={input}
                />
              </div>
            </div>

            <div>
              <label className={label}>Email</label>
              <input
                name="email"
                type="email"
                placeholder="minimagic@gmail.com"
                defaultValue={contact?.email ?? ''}
                className={input}
              />
            </div>

            <div>
              <label className={label}>Address</label>
              <textarea
                name="address"
                rows={3}
                placeholder="MINI MAGIC, U.K. Dream Centre, Kallapu, Mangalore – 575017"
                defaultValue={contact?.address ?? ''}
                className={input}
              />
            </div>

            <div>
              <label className={label}>Google Maps URL <span className="text-gray-400">(optional)</span></label>
              <input
                name="map_url"
                type="url"
                placeholder="https://maps.google.com/..."
                defaultValue={contact?.map_url ?? ''}
                className={input}
              />
            </div>
          </div>

          <div className="mt-6">
            <SubmitButton pendingText="Saving…" className="px-6 py-2.5">
              Save Contact Info
            </SubmitButton>
          </div>
        </section>
      </ActionForm>
    </div>
  )
}
