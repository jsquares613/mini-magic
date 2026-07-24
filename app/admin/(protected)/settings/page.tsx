import { createServerSupabase } from '@/lib/supabase/server'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { updateContactInfo, updateFooterText } from './actions'
import { siteConfig } from '@/config/site'

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

export default async function SettingsPage() {
  const supabase = createServerSupabase()
  const [{ data: contact }, { data: footerSetting }] = await Promise.all([
    supabase.from('contact_information').select('*').eq('id', 1).maybeSingle(),
    supabase.from('site_settings').select('value').eq('key', 'footer_text').maybeSingle(),
  ])
  const footerText = (footerSetting?.value as string) ?? ''

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

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
