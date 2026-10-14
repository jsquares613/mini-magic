import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

/** Admin-wide typeface and base colours (login + panel); the storefront keeps its own. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}>{children}</div>
}
