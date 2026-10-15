/**
 * Loads the Supabase browser client on demand — uploads and sign-in only —
 * so supabase-js isn't part of every admin page's initial JavaScript.
 */
export async function getBrowserSupabase() {
  const { createBrowserSupabase } = await import('./browser')
  return createBrowserSupabase()
}
