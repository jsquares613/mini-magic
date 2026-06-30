'use client'

import { useEffect, useState } from 'react'
import type { EnquiryPayload } from '@/types'
import { siteConfig } from '@/config/site'

type EnquiryButtonProps = {
  /** What the enquiry is about (product name, "Play Area Visit", "General"). */
  subject: string
  source: EnquiryPayload['source']
  productSlug?: string
  label?: string
  className?: string
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

/**
 * A working "Send Enquiry" CTA. Opens an accessible modal, validates the form
 * and POSTs to `/api/enquiries`, which persists to the `enquiries` table
 * (visible in the admin Enquiry CRM).
 */
export default function EnquiryButton({
  subject,
  source,
  productSlug,
  label = 'Send Enquiry',
  className = '',
}: EnquiryButtonProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    const payload: EnquiryPayload = { ...form, subject, source, productSlug }
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('success')
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const close = () => {
    setOpen(false)
    setStatus('idle')
  }

  /** Builds a wa.me link pre-filled with enquiry context. */
  const buildWhatsAppUrl = () => {
    const number = siteConfig.contact.whatsapp.replace(/\D/g, '') // strip non-digits
    const lines = [`Hi! I'm interested in: *${subject}*`]
    if (form.name) lines.push(`Name: ${form.name}`)
    if (form.phone) lines.push(`Phone: ${form.phone}`)
    if (form.message) lines.push(`Message: ${form.message}`)
    const text = encodeURIComponent(lines.join('\n'))
    return `https://wa.me/${number}?text=${text}`
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          'inline-flex items-center justify-center gap-2 rounded-full bg-blue-900 px-8 py-3 font-bold text-white transition hover:scale-105 hover:bg-blue-800'
        }
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Enquiry about ${subject}`}
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Send an Enquiry</h2>
                <p className="text-sm text-gray-500">About: {subject}</p>
              </div>
              <button onClick={close} aria-label="Close" className="text-2xl leading-none text-gray-400 hover:text-gray-700">
                ×
              </button>
            </div>

            {status === 'success' ? (
              <div className="py-8 text-center">
                <div className="mb-3 text-5xl">✅</div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Enquiry sent!</h3>
                <p className="mb-6 text-sm text-gray-600">
                  Thank you — our team will get back to you shortly.
                </p>
                <button
                  onClick={close}
                  className="rounded-full bg-blue-900 px-6 py-2 font-semibold text-white hover:bg-blue-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  required
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="Email address"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="Phone number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <textarea
                  value={form.message}
                  onChange={update('message')}
                  placeholder="Your message (optional)"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                {status === 'error' && (
                  <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full rounded-full bg-blue-900 py-3 font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
                >
                  {status === 'submitting' ? 'Sending…' : 'Submit Enquiry'}
                </button>

                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">or</span>
                  <span className="h-px flex-1 bg-gray-200" />
                </div>

                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 font-bold text-white transition hover:bg-[#1ebe5d]"
                >
                  {/* WhatsApp icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                    <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.514L4 29l7.697-1.813A11.94 11.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22a9.94 9.94 0 0 1-5.059-1.378l-.363-.214-4.57 1.076 1.1-4.457-.237-.377A9.956 9.956 0 0 1 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.406-7.472c-.295-.148-1.745-.861-2.015-.959-.27-.098-.467-.148-.663.148-.196.295-.762.959-.934 1.156-.172.197-.344.222-.639.074-.295-.148-1.246-.459-2.373-1.463-.877-.782-1.469-1.748-1.641-2.043-.172-.295-.018-.454.129-.601.132-.132.295-.344.443-.516.148-.172.197-.295.295-.492.099-.197.05-.369-.025-.516-.074-.148-.663-1.599-.908-2.19-.239-.576-.482-.498-.663-.507l-.565-.01c-.197 0-.516.074-.787.369s-1.033 1.009-1.033 2.46 1.058 2.854 1.206 3.051c.148.197 2.083 3.181 5.047 4.462.706.305 1.256.487 1.685.623.708.226 1.353.194 1.862.118.568-.085 1.745-.714 1.991-1.404.246-.689.246-1.28.172-1.404-.074-.123-.271-.197-.566-.344z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
