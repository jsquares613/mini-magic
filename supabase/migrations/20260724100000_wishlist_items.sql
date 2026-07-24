-- =============================================================================
-- Mini Magic — Wishlist (anonymous, device-scoped)
-- No customer auth exists on the storefront; shoppers are identified by an
-- opaque `device_id` (client-generated uuid, persisted in a first-party
-- cookie). RLS can't scope rows by identity for anon callers, so access is
-- open to anon/authenticated and every query filters by device_id at the
-- application layer — same trust level already extended to the anon key for
-- public catalogue reads.
-- =============================================================================

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (device_id, product_id)
);

create index wishlist_items_device_idx on wishlist_items (device_id);

alter table wishlist_items enable row level security;
create policy "wishlist_items_anon_all" on wishlist_items
  for all to anon, authenticated using (true) with check (true);
