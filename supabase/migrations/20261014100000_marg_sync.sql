-- =============================================================================
-- Mini Magic — Marg ERP product sync
-- Marg (the shop's billing software) is the source of truth for stock, MRP,
-- supplier and the billing name. Every Marg item lands in `products` as an
-- unpublished draft; staff add the customer-facing details (name, photos,
-- category…) and publish. Hand-made products (marg_code is null) work as before.
--
-- Field ownership: the sync always refreshes the raw `marg_*` columns, and also
-- copies them into the customer-facing columns (name / price / brand) UNLESS
-- staff have edited that field — edited fields are listed in
-- `overridden_fields` and the sync leaves them alone.
-- Purchase/cost price (Marg `Prate`) is deliberately never stored.
-- =============================================================================

alter table products
  add column marg_code             text unique,
  add column marg_name             text,
  add column marg_mrp              numeric(10,2),
  add column marg_company          text,
  add column marg_stock            numeric(15,3),
  add column marg_synced_at        timestamptz,
  add column marg_deleted_at       timestamptz,
  add column marg_missing_since    timestamptz,
  add column brand                 text,
  add column overridden_fields     text[] not null default '{}',
  add column stock_status_override text
    check (stock_status_override in ('in-stock', 'low-stock', 'out-of-stock', 'pre-order')),
  add column is_published          boolean not null default false;

-- Everything that exists today was entered by hand and is already live.
update products set is_published = true;

-- Drafts from Marg have no category until staff assign one; a published
-- product must always have one.
alter table products alter column category_id drop not null;
alter table products add constraint products_published_category_chk
  check (not is_published or category_id is not null);

create index products_is_published_idx on products (is_published);
create index products_marg_company_idx on products (marg_company) where marg_code is not null;

-- Public (storefront + mobile app, anon key) sees published products only;
-- staff see drafts too.
drop policy "public_read_products" on products;
create policy "public_read_products" on products
  for select to anon, authenticated using (is_published or is_staff());

-- -----------------------------------------------------------------------------
-- Sync run log
-- -----------------------------------------------------------------------------
create table marg_sync_runs (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('full', 'changes')),
  source        text not null default 'manual' check (source in ('manual', 'cron')),
  status        text not null default 'running' check (status in ('running', 'success', 'failed')),
  since         text,          -- Datetime sent to Marg (null = everything)
  marg_datetime text,          -- DateTime Marg reported; the next run's `since`
  received      int not null default 0,
  inserted      int not null default 0,
  updated       int not null default 0,
  deleted       int not null default 0,
  missing       int not null default 0,
  error         text,
  started_by    uuid references profiles(id) on delete set null,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index marg_sync_runs_started_idx on marg_sync_runs (started_at desc);
-- At most one sync at a time.
create unique index marg_sync_runs_one_running on marg_sync_runs ((true)) where status = 'running';

alter table marg_sync_runs enable row level security;
create policy "staff_read_marg_sync_runs" on marg_sync_runs
  for select to authenticated using (is_staff());
-- Writes go through the service role only.

-- -----------------------------------------------------------------------------
-- Apply a batch of Marg items in one round trip.
-- `items` = [{ code, name?, slug?, company?, mrp?, stock? }]. Null fields mean
-- "not in this message" (Marg's stock-only / rate-only change lists), so they
-- keep the current value. Unknown codes are inserted as drafts — only when
-- the item carries a name (i.e. came from a full product record).
-- -----------------------------------------------------------------------------
create or replace function marg_apply_items(items jsonb)
returns jsonb
language sql
set search_path = public
as $$
  with src as (
    select distinct on (code) *
    from jsonb_to_recordset(items)
      as t(code text, name text, slug text, company text, mrp numeric, stock numeric)
    where code is not null
    order by code
  ),
  upd as (
    update products p set
      marg_name    = coalesce(s.name, p.marg_name),
      marg_company = coalesce(s.company, p.marg_company),
      marg_mrp     = coalesce(s.mrp, p.marg_mrp),
      marg_stock   = coalesce(s.stock, p.marg_stock),
      name  = case when s.name    is null or 'name'  = any(p.overridden_fields) then p.name  else s.name    end,
      brand = case when s.company is null or 'brand' = any(p.overridden_fields) then p.brand else s.company end,
      price = case when s.mrp     is null or 'price' = any(p.overridden_fields) then p.price else s.mrp     end,
      -- products_sale_price_chk: a sale price above the new MRP would reject
      -- the whole batch, so drop it (staff can set a new one).
      sale_price = case
        when s.mrp is not null and not ('price' = any(p.overridden_fields)) and p.sale_price > s.mrp then null
        else p.sale_price
      end,
      marg_synced_at     = now(),
      marg_deleted_at    = null,
      marg_missing_since = null,
      updated_at         = now()
    from src s
    where p.marg_code = s.code
    returning p.marg_code
  ),
  ins as (
    insert into products (
      marg_code, marg_name, marg_company, marg_mrp, marg_stock, marg_synced_at,
      name, slug, brand, price, is_published
    )
    select
      s.code, s.name, s.company, s.mrp, coalesce(s.stock, 0), now(),
      s.name,
      case when exists (select 1 from products x where x.slug = s.slug)
        then s.slug || '-' || left(md5(s.code), 6) else s.slug end,
      s.company, s.mrp, false
    from src s
    where s.name is not null
      and s.slug is not null
      and not exists (select 1 from upd u where u.marg_code = s.code)
    on conflict do nothing
    returning 1
  )
  select jsonb_build_object(
    'updated',  (select count(*) from upd),
    'inserted', (select count(*) from ins)
  );
$$;

revoke execute on function marg_apply_items(jsonb) from public, anon, authenticated;
grant execute on function marg_apply_items(jsonb) to service_role;
