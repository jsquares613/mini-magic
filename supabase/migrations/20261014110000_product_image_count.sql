-- =============================================================================
-- Mini Magic — product photo count + supplier list (admin workflow for Marg items)
--
-- `products.image_count` is kept in step with `product_images` by a trigger,
-- so "missing photo" lists and the "publishing needs a photo" rule are plain
-- column filters (no joins, works for bulk updates too).
-- =============================================================================

alter table products add column image_count int not null default 0;

update products p
set image_count = (select count(*) from product_images i where i.product_id = p.id);

-- Recounts rather than +1/-1 so the column can never drift.
create or replace function sync_product_image_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    update products
    set image_count = (select count(*) from product_images where product_id = new.product_id)
    where id = new.product_id;
  end if;
  if tg_op in ('DELETE', 'UPDATE') then
    update products
    set image_count = (select count(*) from product_images where product_id = old.product_id)
    where id = old.product_id;
  end if;
  return null;
end $$;

create trigger t_product_images_count
  after insert or delete or update of product_id on product_images
  for each row execute function sync_product_image_count();

-- -----------------------------------------------------------------------------
-- Marg suppliers with product counts, for the admin product filter.
-- SECURITY INVOKER (products RLS applies); admin-only, so not exposed to anon.
-- -----------------------------------------------------------------------------
create or replace function marg_supplier_counts()
returns table (supplier text, product_count bigint)
language sql stable
set search_path = public
as $$
  select marg_company, count(*)
  from products
  where marg_code is not null and marg_company is not null
  group by marg_company
  order by marg_company;
$$;

revoke execute on function marg_supplier_counts() from public, anon;
