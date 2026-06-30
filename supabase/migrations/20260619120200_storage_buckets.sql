-- =============================================================================
-- Mini Magic — Supabase Storage buckets + policies (Architecture v2.1 §2.9)
-- Buckets are public-read (public URLs); only staff may upload/modify/delete.
-- =============================================================================

insert into storage.buckets (id, name, public) values
  ('product-images',  'product-images',  true),
  ('category-images', 'category-images', true),
  ('play-area',       'play-area',       true),
  ('about',           'about',           true),
  ('hero',            'hero',            true),
  ('banners',         'banners',         true),
  ('testimonials',    'testimonials',    true),
  ('general',         'general',         true)
on conflict (id) do nothing;

-- All Mini Magic buckets share the same access rules.
-- Public read:
create policy "mm_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in (
    'product-images','category-images','play-area','about','hero','banners','testimonials','general'
  ));

-- Staff write (insert / update / delete):
create policy "mm_staff_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-images','category-images','play-area','about','hero','banners','testimonials','general')
    and is_staff()
  );

create policy "mm_staff_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('product-images','category-images','play-area','about','hero','banners','testimonials','general')
    and is_staff()
  );

create policy "mm_staff_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('product-images','category-images','play-area','about','hero','banners','testimonials','general')
    and is_staff()
  );
