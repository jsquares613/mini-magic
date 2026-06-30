/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle; required by the multi-stage Dockerfile.
  output: 'standalone',
  images: {
    // Allow next/image to load images from Supabase Storage public URLs.
    // Wildcard host covers any Supabase project ref; path is scoped to the
    // public object endpoint. Without this, every product/category/hero/
    // play-area image uploaded via the admin panel crashes the page that
    // renders it ("hostname is not configured under images in next.config.js").
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // The bundled hero artwork is SVG, and admins may upload SVG logos/banners.
    // next/image refuses SVGs by default (returns 400 → broken images). Allow
    // them, but neutralise the XSS risk: force download disposition + a strict
    // CSP/sandbox so any embedded script can never execute when optimised.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

module.exports = nextConfig
