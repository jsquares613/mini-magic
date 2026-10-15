-- =============================================================================
-- Mini Magic — admin performance
--   * grouped counts in one query instead of one request per category/status
--   * index for the admin product list's default sort
-- Both functions are SECURITY INVOKER: RLS applies (staff see everything,
-- the public role can't call them at all).
-- =============================================================================

-- Product counts per category (all + published) for the Categories page.
create or replace function category_product_counts()
returns table (category_id uuid, total bigint, published bigint)
language sql stable
set search_path = public
as $$
  select category_id, count(*), count(*) filter (where is_published)
  from products
  where category_id is not null
  group by category_id;
$$;

revoke execute on function category_product_counts() from public, anon;

-- Enquiry counts per status (optionally within one enquiry type) for the
-- dashboard pipeline and the enquiries list tabs.
create or replace function enquiry_status_counts(p_type enquiry_type default null)
returns table (status enquiry_status, total bigint)
language sql stable
set search_path = public
as $$
  select status, count(*)
  from enquiries
  where p_type is null or enquiry_type = p_type
  group by status;
$$;

revoke execute on function enquiry_status_counts(enquiry_type) from public, anon;

-- Admin product list default order (published first, display order, name):
-- lets Postgres read a page straight from the index instead of sorting
-- every product on each request.
create index if not exists products_admin_list_idx on products (is_published desc, display_order, name);
