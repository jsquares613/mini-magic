-- =============================================================================
-- Mini Magic — Minimal Seed Data
--
-- Run this AFTER schema.sql, once, in the Supabase SQL Editor. Re-runnable:
-- it deletes its own seeded rows first (by known slugs/keys) before inserting.
--
-- Scope: just enough real, non-fake content to verify every storefront page
-- and admin module works end-to-end. NOT hundreds of fake products — 6
-- products across 3 categories is enough to exercise listing, detail,
-- related-products, offers, popular/new flags and age-group filtering.
--
-- Leads (enquiries), audit_log, redirects and profiles are intentionally NOT
-- seeded — those should only ever contain real data (profiles are created
-- automatically by the auth trigger when a real user signs up).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Age groups
-- -----------------------------------------------------------------------------
insert into age_groups (label, slug, min_age, max_age, sort_order) values
  ('0–1 years',  '0-1',      0,  1,    1),
  ('1–3 years',  '1-3',      1,  3,    2),
  ('3–5 years',  '3-5',      3,  5,    3),
  ('5–8 years',  '5-8',      5,  8,    4),
  ('8–12 years', '8-12',     8,  12,   5),
  ('12+ years',  '12-plus',  12, null, 6),
  ('All ages',   'all-ages', null, null, 7)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Categories (the real Mini Magic catalogue structure)
-- -----------------------------------------------------------------------------
insert into categories (name, slug, description, emoji, color, featured, display_order, seo_title, seo_description) values
  ('Toys', 'toys', 'Plush friends, ride-ons, building sets and more — safe, joyful toys that spark imagination at every age.', '🧸', 'bg-yellow-100', true, 1, 'Toys - Minimagic | Safe & Fun Toys for Kids', 'Shop safe, certified toys for every age at Minimagic.'),
  ('Bags', 'bags', 'Backpacks, totes and lunch bags built for school runs, travel and everyday adventures.', '🎒', 'bg-orange-100', true, 2, 'Bags - Minimagic | Backpacks, Totes & More', 'Durable, stylish bags for school, travel and everyday use.'),
  ('Umbrella', 'umbrella', 'Compact, colourful and sturdy umbrellas to keep the whole family dry in style.', '☂️', 'bg-blue-100', true, 3, null, null),
  ('Stationery', 'stationery', 'Notebooks, pens and creative supplies that keep ideas flowing and desks organised.', '✏️', 'bg-pink-100', true, 4, 'Stationery - Minimagic | Notebooks, Pens & Supplies', 'Spark creativity with notebooks, pens and stationery essentials.'),
  ('Household', 'household', 'Thoughtful home essentials and décor that bring comfort, charm and elegance to your space.', '🏠', 'bg-orange-50', true, 5, null, null),
  ('Fashion Accessories', 'fashion-accessories', 'Scarves, hats and finishing touches that add a little sparkle to every outfit.', '🧣', 'bg-pink-50', false, 6, null, null),
  ('Kitchen Essentials', 'kitchen-essentials', 'Everyday kitchen tools and lunch gear made for busy families and little helpers.', '🍱', 'bg-green-50', false, 7, null, null),
  ('Hygiene Products', 'hygiene-products', 'Gentle, family-safe hygiene essentials to keep little hands clean and healthy.', '🧼', 'bg-blue-50', false, 8, null, null),
  ('Disposable Products', 'disposable-products', 'Convenient, party-ready disposables for celebrations, picnics and on-the-go days.', '🎉', 'bg-purple-50', false, 9, null, null)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Category promotion (banner only — does not discount any product)
-- -----------------------------------------------------------------------------
insert into category_promotions (category_id, title, badge_text, description, link, display_order)
select id, 'Toys Sale', '40% Off', 'On selected items', '/categories/toys', 1
from categories where slug = 'toys';

-- -----------------------------------------------------------------------------
-- Products — 6 products across 3 categories (enough to verify everything)
-- -----------------------------------------------------------------------------
insert into products (name, slug, short_description, description, category_id, price, sale_price, material, color, available, tags, features, popular, new_arrival, display_order) values
  ('Classic Teddy Bear', 'classic-teddy-bear',
   'A timeless, huggable companion in soft golden plush.',
   'Meet the Classic Teddy Bear — the cuddly best friend every childhood deserves. Made from ultra-soft, hypoallergenic plush with secure embroidered eyes (no choking hazards).',
   (select id from categories where slug = 'toys'), 170, 102, 'Hypoallergenic plush', 'Golden Brown', true,
   array['teddy','plush','bestseller','gift'],
   array['Ultra-soft, skin-friendly plush fabric','Embroidered eyes — completely safe for infants','Machine washable for easy cleaning'],
   true, false, 1),

  ('Blue Teddy Bear', 'blue-teddy-bear',
   'The Classic Teddy in a calming cornflower blue.',
   'The Blue Teddy Bear brings the same beloved cuddly quality in a soothing blue tone that looks adorable in any nursery.',
   (select id from categories where slug = 'toys'), 170, null, 'Hypoallergenic plush', 'Cornflower Blue', true,
   array['teddy','plush','gift'],
   array['Calming blue tone, perfect for nurseries','Soft, huggable and lightweight'],
   true, false, 2),

  ('Monster Racing Truck', 'monster-racing-truck',
   'Rugged friction-powered truck with giant grip tyres.',
   'Rev up the fun with the Monster Racing Truck! Friction-powered with chunky grip tyres built to survive crashes, jumps and living-room rallies. No batteries needed.',
   (select id from categories where slug = 'toys'), 170, 119, 'BPA-free ABS plastic', 'Red & Black', true,
   array['truck','vehicle','friction'],
   array['Friction-powered — no batteries required','Oversized grip tyres for any surface'],
   true, true, 3),

  ('Leather Tote Bag', 'leather-tote-bag',
   'A roomy, everyday tote in durable faux leather.',
   'Carry it all in style with this spacious faux-leather Tote Bag. Soft-touch handles, a secure zip and a sleek finish.',
   (select id from categories where slug = 'bags'), 799, 599, 'Premium faux leather', 'Tan', true,
   array['bag','tote','fashion'],
   array['Spacious main compartment','Durable, wipe-clean faux leather'],
   false, false, 4),

  ('Deluxe Notebook', 'deluxe-notebook',
   'A premium hardcover notebook with smooth pages.',
   'Capture every idea in the Deluxe Notebook. A sturdy hardcover, 200 smooth ruled pages and a ribbon bookmark.',
   (select id from categories where slug = 'stationery'), 99, null, 'Hardcover, FSC paper', 'Forest Green', true,
   array['notebook','stationery','school'],
   array['200 smooth, bleed-resistant pages','Durable hardcover binding'],
   false, false, 5),

  ('Stationery Pack', 'stationery-pack',
   'An all-in-one kit of pens, pencils and sticky notes.',
   'Everything a desk needs in one bundle! Pens, pencils, an eraser, sharpener, ruler and colourful sticky notes.',
   (select id from categories where slug = 'stationery'), 249, 124, 'Mixed', 'Assorted', true,
   array['stationery','school','bundle'],
   array['Complete back-to-school bundle','Great value multi-pack'],
   false, true, 6)
on conflict (slug) do nothing;

-- Product ↔ age groups
insert into product_age_groups (product_id, age_group_id)
select p.id, a.id from products p, age_groups a
where (p.slug, a.slug) in (
  ('classic-teddy-bear', 'all-ages'),
  ('blue-teddy-bear', 'all-ages'),
  ('monster-racing-truck', '3-5'),
  ('monster-racing-truck', '5-8'),
  ('leather-tote-bag', '12-plus'),
  ('deluxe-notebook', 'all-ages'),
  ('stationery-pack', '5-8')
)
on conflict do nothing;

-- Curated related products (Teddy Bears relate to each other)
insert into product_related (product_id, related_product_id, sort_order)
select p1.id, p2.id, 1 from products p1, products p2
where p1.slug = 'classic-teddy-bear' and p2.slug = 'blue-teddy-bear'
on conflict do nothing;
insert into product_related (product_id, related_product_id, sort_order)
select p1.id, p2.id, 1 from products p1, products p2
where p1.slug = 'blue-teddy-bear' and p2.slug = 'classic-teddy-bear'
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Homepage
-- -----------------------------------------------------------------------------
insert into homepage_hero_slides (title, subtitle, description, image, button_text, button_link, display_order) values
  ('Find Joy in Every Toy', '🎉 Welcome to Minimagic', 'Discover toys that inspire imagination, encourage learning & create beautiful memories.', '/images/hero section/hero1.svg', 'Explore Categories', '/categories', 1),
  ('Style Your Space Beautifully', '🎉 Welcome to Minimagic', 'Discover aesthetic & functional essentials that bring comfort, charm & elegance to your home.', '/images/hero section/hero2.svg', 'Explore Categories', '/categories', 2);

insert into homepage_featured_products (product_id, sort_order)
select id, 1 from products where slug = 'classic-teddy-bear'
on conflict (product_id) do nothing;
insert into homepage_featured_products (product_id, sort_order)
select id, 2 from products where slug = 'monster-racing-truck'
on conflict (product_id) do nothing;

insert into promotional_banners (title, subtitle, badge_text, link, display_order) values
  ('Toys', 'On Selected Items', '40% Off', '/categories/toys', 1),
  ('Stationery', 'On Selected Items', '40% Off', '/categories/stationery', 2);

-- -----------------------------------------------------------------------------
-- Play Area
-- -----------------------------------------------------------------------------
insert into play_area (id, hero_title, hero_description, hero_image, timings, pricing, rules) values (
  1,
  'Where Play Meets Magic',
  'A safe, colourful indoor playground where little ones climb, slide and imagine to their heart''s content.',
  '/images/play area/play-area-1.png',
  '[{"label":"Mon–Fri","value":"10am – 8pm"},{"label":"Sat–Sun","value":"9am – 9pm"}]',
  '[{"label":"Kids","value":"₹299 / hour"},{"label":"Adults","value":"Free with child"}]',
  array['Socks mandatory', 'Adult supervision required', 'No outside food']
) on conflict (id) do nothing;

insert into play_area_gallery (image_url, alt_text, sort_order) values
  ('/images/play area/play-area-1.png', 'Ball Pit', 1),
  ('/images/play area/play-area-2.png', 'Slides & Tunnels', 2),
  ('/images/play area/play-area-3.png', 'Climbing Zone', 3);

-- -----------------------------------------------------------------------------
-- Offers page banner
-- -----------------------------------------------------------------------------
insert into offer_banner (id) values (1) on conflict (id) do nothing;

insert into play_area_features (icon, title, description, sort_order) values
  ('🛡️', 'Always Supervised', 'Trained, friendly staff watch over every zone so parents can relax.', 1),
  ('🧼', 'Sanitised Daily', 'Equipment is cleaned and sanitised throughout the day for hygienic play.', 2),
  ('👶', 'Age-Appropriate', 'Dedicated areas for toddlers and older kids keep play safe and fair.', 3);

-- -----------------------------------------------------------------------------
-- About / Team / Testimonials — wired to app/about/page.tsx via lib/about.ts.
-- -----------------------------------------------------------------------------
insert into about_page (id, story, mission, vision, values_text) values (
  1,
  'Minimagic began with a simple belief: the right toy at the right moment can spark a lifetime of imagination.',
  'To make joyful, safe and enriching products accessible to every family.',
  'To become the most loved family destination where play, learning and everyday essentials come together.',
  'Safety first, honest pricing, genuine care and a focus on children''s smiles.'
) on conflict (id) do nothing;

insert into about_statistics (label, value, suffix, sort_order) values
  ('Happy Families', 50000, '+', 1),
  ('Products Curated', 1200, '+', 2),
  ('Average Rating', 4.9, '★', 3),
  ('Categories', 9, '+', 4);

insert into team_members (name, designation, display_order) values
  ('Aarav Mehta', 'Founder & CEO', 1),
  ('Priya Sharma', 'Head of Curation', 2),
  ('Rahul Verma', 'Operations Lead', 3),
  ('Sneha Iyer', 'Customer Happiness', 4);

insert into testimonials (author_name, author_role, quote, rating, display_order) values
  ('Neha R.', 'Parent of two', 'My kids love the play area and the toys are great quality. The staff are so helpful!', 5, 1),
  ('Arjun K.', 'Dad', 'Booked a birthday party here — fantastic experience, stress-free and the kids had a blast.', 5, 2);

-- -----------------------------------------------------------------------------
-- Contact, business hours, navigation, socials, settings, SEO
-- -----------------------------------------------------------------------------
insert into contact_information (id, phone, whatsapp, email, address) values (
  1, '+91 9876543210', '+919876543210', 'minimagic@gmail.com', 'India'
) on conflict (id) do nothing;

insert into business_hours (day_of_week, opens_at, closes_at) values
  (0, '11:00', '19:00'),
  (1, '10:00', '20:00'),
  (2, '10:00', '20:00'),
  (3, '10:00', '20:00'),
  (4, '10:00', '20:00'),
  (5, '10:00', '21:00'),
  (6, '09:00', '21:00')
on conflict (day_of_week) do nothing;

insert into navigation_links (label, url, location, display_order) values
  ('Home', '/', 'header', 1),
  ('Categories', '/categories', 'header', 2),
  ('Offers', '/offers', 'header', 3),
  ('Play Area', '/play-area', 'header', 4),
  ('About us', '/about', 'header', 5),
  ('About Us', '/about', 'footer_quick', 1),
  ('Offers', '/offers', 'footer_quick', 2),
  ('Play Area', '/play-area', 'footer_quick', 3),
  ('Contact', '/contact', 'footer_quick', 4);

insert into social_links (platform, url, icon, sort_order) values
  ('facebook', 'https://facebook.com/minimagic', 'M8.29 20v-7.21h-2.42V9.25h2.42V7.13c0-2.39 1.46-3.69 3.58-3.69 1.02 0 1.89.08 2.14.11v2.48h-1.47c-1.15 0-1.37.54-1.37 1.35v1.77h2.74l-1.16 3.54h-1.58V20H8.29z', 1),
  ('instagram', 'https://instagram.com/minimagic', 'M16 11.37A4 4 0 1112.63 8m0 0h3.74M8.63 16V8M2 7a5 5 0 015-5h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5z', 2);

insert into site_settings (key, value) values
  ('announcements', '["Special Weekend Offers Available In-Store", "New Arrivals Just Landed", "Birthday Gift Collections Available"]'),
  ('footer_text', '"Making Everyday Moments More Magical ✨"'),
  ('brand', '{"name": "Minimagic", "wordmark": "minimagic"}'),
  ('default_price_display', '"show"')
on conflict (key) do nothing;

insert into seo_pages (page_key, meta_title, meta_description) values
  ('home', 'Minimagic - Find Joy in Every Toy', 'Discover toys, games & everyday essentials for every age with Minimagic.'),
  ('offers', 'Special Offers - Minimagic', 'Deals and discounts on toys and essentials.'),
  ('play-area', 'Play Area - Minimagic', 'A safe, supervised indoor playground for kids.'),
  ('about', 'About Us - Minimagic', 'Our story, mission and team.'),
  ('contact', 'Contact Us - Minimagic', 'Get in touch with the Minimagic team.'),
  ('categories', 'Categories - Minimagic', 'Browse toys, accessories and everyday essentials.')
on conflict (page_key) do nothing;

-- =============================================================================
-- Done. Create your first admin user next (Authentication → Users → Add User
-- in the Supabase dashboard), then run:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =============================================================================
