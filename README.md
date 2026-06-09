# GoalZone — Football Kits Catalog

Mobile-first jersey catalog. Customers browse, pick a size, and order on WhatsApp.
The team manages listings and stock in the **Supabase dashboard** (Table Editor) — no code required.

## Stack
Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Supabase (Postgres) · Vercel

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
| `created_at` | timestamptz | newest first |

Row Level Security is on with a **public read-only** policy. There are no public write
policies, so the catalog can be read with the publishable key but only edited from the
Supabase dashboard.

## Local development
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — your project URL (Supabase → Project Settings → API)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the publishable key (`sb_publishable_…`)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — the order line in international digits, e.g. `9613XXXXXX`
   - `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally
3. `npm run dev` → site at http://localhost:3000

## Tests
`npm test` — Vitest unit tests covering catalog logic (sold-out, search filter, sort) and WhatsApp link building.

## Deploy (Vercel)
1. Push to GitHub, import the repo in Vercel.
2. Add the env vars from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to the production URL).
3. Deploy. Pages render dynamically, so dashboard edits show up on the next page load.

## Managing the catalog (for the team — no code)
Open your project in the Supabase dashboard → **Table Editor** → `products`.
- **Add a jersey:** Insert row → fill name, country, price, sizes (e.g. `{S,M,L,XL}`),
  image_url, in_stock = true → Save.
- **Mark sold out:** open the row → set `in_stock` to `false` → Save. The whole card
  shows a "Sold Out" overlay.
- **Images:** upload to Supabase **Storage** (make the bucket public), copy the public
  URL into `image_url`. Any public HTTPS image URL works.
- **Change the WhatsApp number:** update `NEXT_PUBLIC_WHATSAPP_NUMBER` in Vercel env vars
  and redeploy (it rarely changes).
