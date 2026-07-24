'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { deleteStorageObjectIfChanged } from '@/lib/supabase/storage'
import { str, bool } from '@/lib/admin/form'

export async function updateOfferBanner(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: current } = await supabase.from('offer_banner').select('image').eq('id', 1).maybeSingle()

  const image = str(formData, 'image')
  const { error } = await supabase
    .from('offer_banner')
    .upsert({
      id: 1,
      image,
      active: bool(formData, 'active'),
    })
  if (error) throw new Error(error.message)

  await deleteStorageObjectIfChanged(current?.image, image)
  revalidatePath('/admin/offers')
  revalidatePath('/offers')
}
