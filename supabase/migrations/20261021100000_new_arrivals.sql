-- New Arrivals become automatic and date-based, replacing the hand-ticked
-- `new_arrival` flag (which nothing reads any more; the column is kept so
-- older seed scripts still run).
--
--   new_since           When the product became "new stock": stamped for every
--                       product created from now on (a new Marg item code, or one
--                       added by hand), or set by staff ("Mark as new").
--                       NULL = not a new arrival — the catalogue that existed
--                       before this migration, or removed by staff.
--   first_published_at  When it first went live on the website.
--   arrived_at          When it arrived for customers: the later of the two, so
--                       the days a new item waits for photos don't use up its
--                       "new" period. NULL until it is new stock AND published.
--
-- The storefront shows published products by arrived_at, newest first; how long
-- one counts as "new" is the `new_arrival_days` site setting (default 30).

alter table products
  add column if not exists new_since          timestamptz,
  add column if not exists first_published_at timestamptz;

-- Live products: their real first-publish time was never recorded; creation is the closest.
update products set first_published_at = created_at
where is_published and first_published_at is null;

-- Products ticked "New arrival" today stay in New Arrivals, in their current
-- order, until newer ones replace them.
with ticked as (
  select id, row_number() over (order by display_order, name) as n
  from products
  where new_arrival and new_since is null
)
update products p set new_since = now() - make_interval(secs => t.n)
from ticked t
where p.id = t.id;

-- Everything created from here on starts as new stock (see the trigger for the
-- one exception: the very first Marg import).
alter table products alter column new_since set default now();

alter table products
  add column if not exists arrived_at timestamptz generated always as (
    -- greatest() ignores NULLs, so both dates must be present explicitly.
    case
      when new_since is null or first_published_at is null then null
      else greatest(new_since, first_published_at)
    end
  ) stored;

create index if not exists products_arrived_at_idx
  on products (arrived_at desc)
  where arrived_at is not null;

create or replace function products_new_arrival_dates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Until a Marg sync has succeeded, inserted Marg items are the initial import
  -- of the existing catalogue (or a retry of a failed one), not new stock.
  if tg_op = 'INSERT' and new.marg_code is not null then
    if not exists (select 1 from marg_sync_runs where status = 'success') then
      new.new_since := null;
    end if;
  end if;

  if new.is_published and new.first_published_at is null then
    new.first_published_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists products_new_arrival_dates on products;
create trigger products_new_arrival_dates
  before insert or update of is_published on products
  for each row execute function products_new_arrival_dates();
