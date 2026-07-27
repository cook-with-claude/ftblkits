# GoalZone — Football Kits Catalog

Mobile-first jersey catalog. Customers browse, pick a size, and order on WhatsApp.
The team manages listings, photos, and stock through the password-protected **`/admin` panel**.

## Stack
Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Supabase (Postgres) · Netlify

## Data model
A single `products` table:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `name` | text | jersey name, e.g. "Argentina Home" |
| `country` | text | used by search |
| `price` | numeric | USD |
| `sizes` | text[] | available sizes, e.g. `{S,M,L,XL}` |
| `image_url` | text | public image URL (Supabase Storage or any host) |
| `in_stock` | boolean | whole-product stock; `false` shows a "Sold Out" overlay |
| `hidden` | boolean | hides a kit from the public catalog/detail/sitemap while keeping it in admin |
| `is_mystery` | boolean | marks a product as a mystery-kit tier instead of a regular catalog kit |
| `description` | text | short kit description shown on the detail page, e.g. "Spain home kit — adidas…" |
| `created_at` | timestamptz | newest first |

Kit photos live in a public Supabase Storage bucket named **`kits`** (public-read only).
Image URLs follow `…/storage/v1/object/public/kits/<file>.jpg`.

Row Level Security is on with a **visible-products-only public read** policy. Hidden rows
and every write operation remain unavailable to the public key; admin writes use a
server-only service-role key after manager authentication.

## Local development
1. `npm install`
2. Run the Supabase SQL in `supabase/migrations/` against your project.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — your project URL (Supabase → Project Settings → API)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the publishable key (`sb_publishable_…`)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — the order line in international digits, e.g. `9613XXXXXX`
   - `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only service role key for `/api/admin/*`
   - `ADMIN_PASSWORD` — strong, unique shared manager password for `/admin`
   - `ADMIN_SESSION_SECRET` — at least 32 random bytes for cookie signing
4. `npm run dev` → site at http://localhost:3000

## Tests
`npm test` — Vitest tests covering catalog behavior, admin validation/authentication,
image signatures, outage handling, configuration, and WhatsApp link building.

## Deploy (Netlify)
1. Push to GitHub and connect the repository to Netlify.
2. Add the env vars from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to the production URL).
3. Deploy. Pages render dynamically, so dashboard edits show up on the next page load.

## Managing the catalog (for the team — no code)
Managers use `/admin` after entering the shared password. Supabase Table Editor remains
an emergency-only option for the project owner.
- **Add a jersey:** Insert row → fill name, country, price, sizes (e.g. `{S,M,L,XL}`),
  image_url, in_stock = true → Save.
- **Mark sold out:** open the row → set `in_stock` to `false` → Save. The whole card
  shows a "Sold Out" overlay.
- **Add a description:** fill the `description` column — it appears under the price on the
  jersey detail page.
- **Images:** upload through `/admin`. Public product images are restricted to the
  configured Supabase **`kits`** Storage bucket.
- **Change the WhatsApp number:** update `NEXT_PUBLIC_WHATSAPP_NUMBER` in Netlify env vars
  and redeploy (it rarely changes).

## Docs
- [`docs/launch-readiness.md`](docs/launch-readiness.md) — read before every production launch.
- [`docs/session-log.md`](docs/session-log.md) — running history of work sessions, newest first.
- [`docs/rebrand-notes.md`](docs/rebrand-notes.md) — planned pivot from World-Cup-only to a
  general replica-jersey reseller (taxonomy, navigation, branding). Not started.
- [`docs/plans/2026-07-26-referral-and-salespeople.md`](docs/plans/2026-07-26-referral-and-salespeople.md)
  — designed-but-unbuilt referral loop and salesperson attribution. Not started.

> `docs/superpowers/` holds the original 2026-06-09 spec and plan. They describe an abandoned
> **Sanity** architecture and are kept for history only — they do not reflect the current build.
