'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/supabase/auth'
import { runMargSync } from '@/lib/marg/sync'
import { isActionError, type ActionResult } from '@/lib/admin/actionResult'

export async function syncMargNow(formData: FormData): Promise<ActionResult> {
  const profile = await requireStaff('admin')
  const kind = formData.get('kind') === 'full' ? 'full' : 'changes'

  const result = await runMargSync({ kind, source: 'manual', startedBy: profile.id })
  revalidatePath('/admin/marg')
  revalidatePath('/admin/products')
  if (isActionError(result)) return result
}
