-- =============================================================================
-- Mini Magic — Marg barcode
-- Marg's `ENCODE` field on a product is the item's barcode. Stored as a raw
-- `marg_barcode` column (kept fresh by the sync, searchable in the admin and
-- on the storefront). Existing rows are filled in by the next full Marg sync,
-- or earlier if Marg reports the product as changed.
-- =============================================================================

alter table products add column marg_barcode text;

create index products_marg_barcode_idx on products (marg_barcode) where marg_barcode is not null;

-- Same as 20261014100000_marg_sync.sql, plus `barcode`. A null barcode means
-- "not in this message" (stock-only / rate-only lists), so the current value stays.
create or replace function marg_apply_items(items jsonb)
returns jsonb
language sql
set search_path = public
as $$
  with src as (
    select distinct on (code) *
    from jsonb_to_recordset(items)
      as t(code text, name text, slug text, company text, mrp numeric, stock numeric, barcode text)
    where code is not null
    order by code
  ),
  upd as (
    update products p set
      marg_name    = coalesce(s.name, p.marg_name),
      marg_company = coalesce(s.company, p.marg_company),
      marg_mrp     = coalesce(s.mrp, p.marg_mrp),
      marg_stock   = coalesce(s.stock, p.marg_stock),
      marg_barcode = coalesce(s.barcode, p.marg_barcode),
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
      marg_code, marg_name, marg_company, marg_mrp, marg_stock, marg_barcode, marg_synced_at,
      name, slug, brand, price, is_published
    )
    select
      s.code, s.name, s.company, s.mrp, coalesce(s.stock, 0), s.barcode, now(),
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
