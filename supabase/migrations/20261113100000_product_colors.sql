-- =============================================================================
-- Mini Magic — product colours with per-colour photos
--
-- products.colors        the colours a product comes in:
--                        [{ "id": "<uuid>", "name": "Red", "hex": "#ef4444" }, …]
--                        `id` is stable, so renaming a colour keeps its photos.
-- product_images.color_id which colour a photo shows (an id from products.colors);
--                        null = a general photo shown for every colour.
--
-- The old free-text products.color column stays (the mobile app and older
-- code read it); the admin keeps it filled with the colour names.
--
-- Product field visibility (Admin → product form toggles) needs no schema:
-- it lives in site_settings under the key 'product_fields'.
-- =============================================================================

alter table products add column if not exists colors jsonb not null default '[]'::jsonb;

alter table product_images add column if not exists color_id text;
create index if not exists product_images_color_idx on product_images (product_id, color_id);

-- Turn existing free-text colours ("Red, Blue") into colour entries without swatches.
update products p
set colors = coalesce((
  select jsonb_agg(jsonb_build_object('id', gen_random_uuid()::text, 'name', trim(c), 'hex', null) order by ord)
  from unnest(string_to_array(p.color, ',')) with ordinality as t(c, ord)
  where trim(c) <> ''
), '[]'::jsonb)
where p.color is not null and trim(p.color) <> '' and p.colors = '[]'::jsonb;
