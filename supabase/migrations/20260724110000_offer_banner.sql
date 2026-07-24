-- Offers page hero banner (the "BUY 1 GET 1 FREE" strip). Singleton row.
create table if not exists offer_banner (
  id            int primary key default 1 check (id = 1),
  badge_text    text not null default 'BUY 1
GET 1
FREE',
  heading       text not null default 'ON ANY PRODUCT',
  subheading    text default 'Shop more. Save more.',
  terms_text    text default '*T&C Apply',
  image         text,
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);

drop trigger if exists t_offer_banner_touch on offer_banner;
create trigger t_offer_banner_touch before update on offer_banner for each row execute function touch_updated_at();

alter table offer_banner enable row level security;
drop policy if exists "public_read_offer_banner" on offer_banner;
create policy "public_read_offer_banner" on offer_banner for select to anon, authenticated using (true);
drop policy if exists "staff_write_offer_banner" on offer_banner;
create policy "staff_write_offer_banner" on offer_banner for all to authenticated using (is_staff()) with check (is_staff());

insert into offer_banner (id) values (1) on conflict (id) do nothing;
