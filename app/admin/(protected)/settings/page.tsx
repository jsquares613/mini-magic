import { createServerSupabase } from '@/lib/supabase/server'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { Card, Field, Page, PageHeader, Switch, ui } from '@/components/admin/ui'
import { MapPinIcon, MegaphoneIcon, TypeIcon } from '@/components/admin/icons'
import { updateContactInfo, updateFooterText, updateBannerSettings } from './actions'
import { siteConfig } from '@/config/site'

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
  const announcements: string[] = (announcementsSetting?.value as string[]) ?? [...siteConfig.announcements]

  return (
    <Page>
      <PageHeader title="Settings" description="Site-wide text and the contact details shown in the footer and on the Contact page." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Scrolling banner */}
          <ActionForm action={updateBannerSettings} successMessage="Banner updated successfully">
            <Card
              title="Announcement bar"
              description="The strip at the very top of every page."
              icon={MegaphoneIcon}
              tone="red"
              footer={
                <div className="flex justify-end py-1">
                  <SubmitButton pendingText="Saving…">Save banner</SubmitButton>
                </div>
              }
            >
              <div className="space-y-5">
                <Field label="Messages" hint="One message per line.">
                  <textarea
                    name="messages"
                    rows={5}
                    defaultValue={announcements.join('\n')}
                    placeholder={'Special Weekend Offers Available In-Store\nNew Arrivals Just Landed\nBirthday Gift Collections Available'}
                    className={ui.input}
                  />
                </Field>
                <Switch name="marquee_enabled" defaultChecked={marqueeEnabled} label="Scrolling animation" description="Turn off to show the messages without movement." />
              </div>
            </Card>
          </ActionForm>

          {/* Footer text */}
          <ActionForm action={updateFooterText} successMessage="Footer text saved successfully">
            <Card
              title="Footer tagline"
              description="Shown under the brand name in the footer."
              icon={TypeIcon}
              tone="gray"
              footer={
                <div className="flex justify-end py-1">
                  <SubmitButton pendingText="Saving…">Save tagline</SubmitButton>
                </div>
              }
            >
              <Field label="Tagline" hint={`Leave blank to use the default: “${siteConfig.tagline}”.`}>
                <input name="footer_text" placeholder={siteConfig.tagline} defaultValue={footerText} className={ui.input} />
              </Field>
            </Card>
          </ActionForm>
        </div>

        {/* Contact information */}
        <ActionForm action={updateContactInfo} successMessage="Contact information saved successfully">
          <Card
            title="Contact information"
            description="Leave a field blank to hide it on the website."
            icon={MapPinIcon}
            tone="blue"
            footer={
              <div className="flex justify-end py-1">
                <SubmitButton pendingText="Saving…">Save contact info</SubmitButton>
              </div>
            }
          >
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Phone">
                  <input name="phone" type="tel" placeholder="+91 72594 07351" defaultValue={contact?.phone ?? ''} className={ui.input} />
                </Field>
                <Field label="WhatsApp number">
                  <input name="whatsapp" type="tel" placeholder="+917259407351" defaultValue={contact?.whatsapp ?? ''} className={ui.input} />
                </Field>
              </div>
              <Field label="Email">
                <input name="email" type="email" placeholder="minimagic@gmail.com" defaultValue={contact?.email ?? ''} className={ui.input} />
              </Field>
              <Field label="Address">
                <textarea
                  name="address"
                  rows={3}
                  placeholder="MINI MAGIC, U.K. Dream Centre, Kallapu, Mangalore – 575017"
                  defaultValue={contact?.address ?? ''}
                  className={ui.input}
                />
              </Field>
              <Field label="Google Maps link" hint="Optional.">
                <input name="map_url" type="url" placeholder="https://maps.google.com/..." defaultValue={contact?.map_url ?? ''} className={ui.input} />
              </Field>
            </div>
          </Card>
        </ActionForm>
      </div>
    </Page>
  )
}
