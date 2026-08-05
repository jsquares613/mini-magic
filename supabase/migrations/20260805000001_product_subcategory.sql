-- Link products to a subcategory (optional).
-- ON DELETE SET NULL: deleting a subcategory leaves the product uncategorised, not orphaned.
alter table products
  add column subcategory_id uuid references subcategories(id) on delete set null;

create index products_subcategory_idx on products (subcategory_id) where subcategory_id is not null;
