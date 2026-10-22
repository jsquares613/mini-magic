-- Homepage "All Products" rail: published products in a shuffled order that is
-- fixed for a given seed (the app passes today's date), so the order changes
-- daily but stays put while a visitor swipes through page after page.
--
-- Returns one page of ids plus the total, ordered by md5(id || seed) — a
-- deterministic shuffle with no stored state. SECURITY INVOKER (the default),
-- so row-level security still applies to whoever calls it.

create or replace function shuffled_product_ids(p_seed text, p_offset int default 0, p_limit int default 12)
returns table (id uuid, total bigint)
language sql
stable
set search_path = public
as $$
  select p.id, count(*) over () as total
  from products p
  where p.is_published
  order by md5(p.id::text || coalesce(p_seed, '')), p.id
  offset greatest(coalesce(p_offset, 0), 0)
  limit least(greatest(coalesce(p_limit, 12), 1), 48);
$$;

grant execute on function shuffled_product_ids(text, int, int) to anon, authenticated;
