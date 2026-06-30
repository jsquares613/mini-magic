# Supabase Setup Guide — Mini Magic

Follow these steps in order on a **fresh** Supabase project. Total time: ~15 minutes.

---

## 1. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**.
2. Choose an organisation, name (e.g. `mini-magic`), database password (save it), and region (pick one close to your users).
3. Wait for provisioning to finish (~2 minutes).

---

## 2. Run `schema.sql`

1. In the Supabase dashboard, open **SQL Editor** → **New query**.
2. Open [supabase/schema.sql](supabase/schema.sql) in this repo, copy its **entire contents**, paste into the SQL Editor.
3. Click **Run**.

This single file creates everything: extensions, 8 enum types, 30 tables, all foreign keys/constraints/indexes, the `touch_updated_at` and `handle_new_user` functions + triggers, every RLS policy, and the 8 Storage buckets + their policies. No manual edits needed — run it exactly as-is, once.

**Expected result:** "Success. No rows returned." If you get an error, you likely ran it twice on the same project (some statements aren't idempotent, e.g. `create type`) — see Troubleshooting below.

---

## 3. Run `seed.sql`

1. Still in **SQL Editor** → **New query**.
2. Open [supabase/seed.sql](supabase/seed.sql), copy its contents, paste, **Run**.

This populates: 7 age groups, 9 categories, 1 category promotion, **6 demo products** (not hundreds — just enough to exercise listing/detail/related/offers/age-filtering), homepage hero slides + sections + featured products + banners, play area content, about/team/testimonials demo content, contact info, business hours, navigation, socials, and site settings.

It is safe to re-run — it uses `on conflict ... do nothing` / natural unique keys, so re-running won't duplicate rows (it will skip everything that already exists).

**Not seeded on purpose:** enquiries, enquiry_notes, audit_log, redirects, profiles — these should only ever contain real data. `profiles` rows are created automatically by the `handle_new_user` trigger when someone signs in.

---

## 4. Verify Storage Buckets

`schema.sql` already created these (Step 2) — this is just a sanity check.

1. Dashboard → **Storage**. You should see 8 buckets, all marked **Public**:
   - `product-images`
   - `category-images`
   - `play-area`
   - `about`
   - `hero`
   - `banners`
   - `testimonials`
   - `general`
2. Each bucket is public-read (anyone can view uploaded images via their public URL) but only signed-in staff (`profiles.role` = `admin` or `editor`) can upload/modify/delete — enforced by the `mm_staff_*` policies on `storage.objects`, already created in Step 2.

---

## 5. Configure Authentication

The admin panel uses Supabase email/password auth — no customer accounts (this is a catalogue site, not checkout).

1. Dashboard → **Authentication** → **Providers** → confirm **Email** is enabled (it is by default).
2. Dashboard → **Authentication** → **Users** → **Add user** → **Create new user**.
   - Enter your email + a password. Toggle **Auto Confirm User** on (so you don't need to click an email link).
3. The `handle_new_user` trigger (from `schema.sql`) automatically creates a matching row in `public.profiles` with `role = 'viewer'`.
4. **Promote yourself to admin** — back in **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   Replace with the email you just created. Roles: `admin` (full access incl. user management), `editor` (manage content + enquiries, no user management), `viewer` (read-only, no admin write access).

---

## 6. Configure Environment Variables

1. Dashboard → **Settings** → **API**. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (⚠️ secret, server-only) → `SUPABASE_SERVICE_ROLE_KEY`
2. In the project root:
   ```bash
   cp .env.example .env.local
   ```
3. Edit `.env.local` and paste in the three Supabase values, plus:
   - `NEXT_PUBLIC_SITE_URL` — your deployment URL (`http://localhost:3000` for local dev).
   - `WHATSAPP_NUMBER` — default WhatsApp contact number in E.164 digits (e.g. `919876543210`). The same number can also be set in the admin panel under Settings → Contact (`contact_information.whatsapp`), which takes precedence once configured there.
4. **Never commit `.env.local`** (already covered by `.gitignore`). Never put `SUPABASE_SERVICE_ROLE_KEY` in any `NEXT_PUBLIC_*` variable or client-side code.

---

## 7. Generate Database Types

The repo ships with a **hand-authored** `lib/supabase/database.types.ts` that exactly mirrors `schema.sql`. Once your live project is up, regenerate it from the real database so it's byte-exact and stays in sync going forward:

```bash
npx supabase login

npx supabase gen types typescript --project-id YOUR_PROJECT_ID \
  > lib/supabase/database.types.ts
```

Find `YOUR_PROJECT_ID` in Dashboard → **Settings** → **General** → **Reference ID**.

After regenerating, run a type-check to confirm nothing drifted:
```bash
npx tsc --noEmit
```

---

## 8. Install the missing dependency and verify

```bash
npm install @supabase/ssr@^0.12   # required for admin auth (server/browser clients)
npx tsc --noEmit                  # should report 0 errors
npx next build                    # should complete all routes
```

## 9. Run it

```bash
npm run dev
```

- Storefront: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin/login` — sign in with the user you created in Step 5.

---

## Troubleshooting

**"type X already exists" / "relation X already exists" when re-running `schema.sql`**
You ran it more than once on the same project. `schema.sql` is meant for a *fresh* project. To start over: **Settings → General → Danger Zone → Pause/Restore**, or create a new project and re-run from Step 2. (Do not run `schema.sql` twice on a project with real data — it is not written to be idempotent for `create type`/`create table`.)

**Admin pages return `503 Admin panel is not configured`**
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` aren't set in `.env.local` (or the server wasn't restarted after editing it). Fix the env vars and restart `npm run dev`.

**Signed in but redirected with `?error=not-staff`**
Your user has no `profiles` row, or its `role` isn't `admin`/`editor`/`viewer`. Check: `select * from public.profiles where email = 'you@example.com';` — if missing, the auth trigger didn't fire (rare); insert manually:
```sql
insert into public.profiles (id, email, role)
select id, email, 'admin' from auth.users where email = 'you@example.com';
```

**Products/categories don't appear on the storefront**
Confirm `seed.sql` ran successfully (`select count(*) from products;` should return `6`). Product/category pages use ISR (`revalidate = 60`) — content appears on first request and refreshes within 60s, or immediately after an admin save (which calls `revalidatePath`).
