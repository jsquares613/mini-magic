-- Subcategories: one-to-many off categories.
-- On category delete → subcategories cascade away.
create table subcategories (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references categories(id) on delete cascade,
  name          text not null,
  slug          text not null,
  emoji         text,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  unique(category_id, slug)
);

create index subcategories_category_idx on subcategories (category_id, display_order);

-- Seed subcategories for each main category.
-- Rows are skipped silently if the parent category slug doesn't exist yet.
insert into subcategories (category_id, name, slug, emoji, display_order)
select c.id, v.name, v.slug, v.emoji, v.display_order
from (values
  -- Toys
  ('toys', 'Dolls & Dollhouses',   'dolls-dollhouses',    '🪆', 1),
  ('toys', 'Building Toys',        'building-toys',        '🧱', 2),
  ('toys', 'Remote Control Toys',  'remote-control-toys',  '🕹️', 3),
  ('toys', 'Toy Vehicles',         'toy-vehicles',         '🚗', 4),
  ('toys', 'Baby Toys',            'baby-toys',            '🍼', 5),
  ('toys', 'Soft Toys',            'soft-toys',            '🧸', 6),
  -- Bags
  ('bags', 'School Bags',   'school-bags',  '🎒', 1),
  ('bags', 'Backpacks',     'backpacks',    '🎒', 2),
  ('bags', 'Lunch Bags',    'lunch-bags',   '🥪', 3),
  ('bags', 'Sling Bags',    'sling-bags',   '👜', 4),
  ('bags', 'Tote Bags',     'tote-bags',    '🛍️', 5),
  ('bags', 'Travel Bags',   'travel-bags',  '🧳', 6),
  -- Umbrella
  ('umbrella', 'Kids Umbrellas',      'kids-umbrellas',      '🌂', 1),
  ('umbrella', 'Folding Umbrellas',   'folding-umbrellas',   '☂️', 2),
  ('umbrella', 'Golf Umbrellas',      'golf-umbrellas',      '⛳', 3),
  ('umbrella', 'Rain Ponchos',        'rain-ponchos',        '🌧️', 4),
  ('umbrella', 'UV Protection',       'uv-protection',       '☀️', 5),
  ('umbrella', 'Windproof Umbrellas', 'windproof-umbrellas', '💨', 6),
  -- Stationery
  ('stationery', 'Pens & Pencils',  'pens-pencils',   '✏️', 1),
  ('stationery', 'Notebooks',       'notebooks',       '📓', 2),
  ('stationery', 'Art Supplies',    'art-supplies',    '🎨', 3),
  ('stationery', 'Geometry Boxes',  'geometry-boxes',  '📐', 4),
  ('stationery', 'Sticky Notes',    'sticky-notes',    '📝', 5),
  ('stationery', 'Folders & Files', 'folders-files',   '📁', 6),
  -- Household
  ('household', 'Storage & Organisation', 'storage-organisation', '📦', 1),
  ('household', 'Cleaning Supplies',      'cleaning-supplies',    '🧹', 2),
  ('household', 'Bathroom Essentials',    'bathroom-essentials',  '🚿', 3),
  ('household', 'Home Decor',             'home-decor',           '🏠', 4),
  ('household', 'Bedding',                'bedding',              '🛏️', 5),
  ('household', 'Lighting',               'lighting',             '💡', 6),
  -- Fashion Accessories
  ('fashion-accessories', 'Sunglasses',       'sunglasses',       '🕶️', 1),
  ('fashion-accessories', 'Watches',          'watches',          '⌚', 2),
  ('fashion-accessories', 'Jewellery',        'jewellery',        '💍', 3),
  ('fashion-accessories', 'Belts & Wallets',  'belts-wallets',    '👜', 4),
  ('fashion-accessories', 'Scarves & Caps',   'scarves-caps',     '🧣', 5),
  ('fashion-accessories', 'Hair Accessories', 'hair-accessories', '💇', 6),
  -- Kitchen Essentials
  ('kitchen-essentials', 'Cookware',           'cookware',           '🍳', 1),
  ('kitchen-essentials', 'Bakeware',           'bakeware',           '🥧', 2),
  ('kitchen-essentials', 'Kitchen Tools',      'kitchen-tools',      '🔪', 3),
  ('kitchen-essentials', 'Storage Containers', 'storage-containers', '🫙', 4),
  ('kitchen-essentials', 'Cutlery',            'cutlery',            '🍴', 5),
  ('kitchen-essentials', 'Water Bottles',      'water-bottles',      '🚰', 6),
  -- Hygiene Products
  ('hygiene-products', 'Hand Care',    'hand-care',    '🧴', 1),
  ('hygiene-products', 'Oral Care',    'oral-care',    '🦷', 2),
  ('hygiene-products', 'Body Care',    'body-care',    '🧼', 3),
  ('hygiene-products', 'Hair Care',    'hair-care',    '💆', 4),
  ('hygiene-products', 'Face Care',    'face-care',    '🧖', 5),
  ('hygiene-products', 'Baby Hygiene', 'baby-hygiene', '👶', 6),
  -- Disposable Products
  ('disposable-products', 'Plates & Cups',  'plates-cups',   '🥤', 1),
  ('disposable-products', 'Disposable Cutlery', 'disposable-cutlery', '🍴', 2),
  ('disposable-products', 'Food Wrap',      'food-wrap',     '📦', 3),
  ('disposable-products', 'Bags & Pouches', 'bags-pouches',  '🛍️', 4),
  ('disposable-products', 'Tissue & Wipes', 'tissue-wipes',  '🧻', 5),
  ('disposable-products', 'Gloves',         'gloves',        '🧤', 6)
) as v(cat_slug, name, slug, emoji, display_order)
join categories c on c.slug = v.cat_slug;
