# GoalZone — Football Kits Catalog

Mobile-first kit catalog covering leagues, clubs, national teams and retro. Customers
browse, pick a size, and order on WhatsApp. The team manages listings, photos, stock and
**sections** through the password-protected **`/admin` panel**.

## Stack
Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Supabase (Postgres) · Netlify

## Routes
| Route | What |
|---|---|
| `/` | Landing page: hero, section directory, mystery band, new arrivals |
| `/kits` | Browse everything, with search / team / in-stock filters |
| `/kits/[section]` | One section's kits, e.g. `/kits/la-liga` |
| `/jersey/[id]` | Kit detail + size picker + WhatsApp order |
| `/admin` | Manage kits and sections |

Storefront pages live in the `(storefront)` route group, whose layout fetches the section
list for the shared header and footer. `/admin` and `/api` sit outside it.

Every page sets its own `alternates.canonical`. The root layout deliberately does **not**,
because Next merges root metadata into every route — a canonical there would tell search
engines that every section and kit page is a duplicate of the homepage.

## Data model

### `products`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `name` | text | kit name, e.g. "Argentina Home" |
| `team` | text | display label + search term: a country ("Argentina") or a club ("Real Madrid") |
| `sections` | text[] | slugs of the sections this kit appears in; a kit can be in several |
| `price` | numeric | USD |
| `sizes` | text[] | available sizes, e.g. `{S,M,L,XL}` |
| `image_url` | text | public image URL in the `kits` bucket |
| `in_stock` | boolean | whole-product stock; `false` shows a "Sold Out" overlay |
| `hidden` | boolean | hides a kit from the public catalog/detail/sitemap while keeping it in admin |
| `is_mystery` | boolean | marks a product as a mystery-kit tier instead of a regular catalog kit |
| `description` | text | short kit description shown on the detail page |
| `created_at` | timestamptz | newest first |

> `country` still exists alongside `team`, kept in sync by a trigger, so the pre-rebrand
> deploy keeps working. See **Pending migration** below.

### `sections`
The shop's navigation, editable from `/admin` with no deploy.

| Column | Type | Notes |
|---|---|---|
| `slug` | text | URL segment — `/kits/<slug>`. Lowercase, hyphenated, unique |
| `label` | text | display name |
| `nav_group` | text | how the header renders it: `featured` (standalone link) or `type` / `league` / `country` / `club` / `mystery` (dropdown). CHECK-constrained — adding a *group* needs a migration; adding a *section* does not |
| `sort_order` | integer | order within its group |
| `accent` | text | optional `#rrggbb` used for the section's header bar and card edge |
| `description` | text | optional blurb shown on the section page |
| `hidden` | boolean | keeps the section in admin but removes it from the site |

Membership is `products.sections` (an array of slugs, GIN-indexed) rather than a join
table: the admin routes have no transaction layer, so a two-statement save could
half-apply. In place of a foreign key there is a slug-format CHECK, an application-side
existence check, a database trigger that rejects invalid/dangling/duplicate memberships
while locking the referenced section rows, and section triggers that fan every rename or
delete out across products in the same transaction. The admin RPCs address sections by
stable UUID and are executable only by the service role.

Kit photos live in a public Supabase Storage bucket named **`kits`** (public-read only).
Image URLs follow `…/storage/v1/object/public/kits/<file>.jpg`.

Row Level Security is on for both tables with a **visible-rows-only public read** policy.
Hidden rows and every write remain unavailable to the public key; admin writes use a
server-only service-role key after manager authentication. Because hidden sections are
unreadable by the public key, requesting one returns a 404 with no application-level check.

## Pending migration
`supabase/migrations/PENDING_20260727140000_drop_country_column.sql.txt` drops the old
`country` column and its sync trigger. **Run it only after the rebrand is deployed and
verified in production** — see the header in that file. It is saved as `.sql.txt` so it is
not applied by accident.

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
### Kits tab
- **Add a kit:** "+ Add a new kit" → name, team, price, sizes, photo, then tick the
  sections it belongs to → Add.
- **Mark sold out:** untick **In stock** → Save. The card gets a "Sold Out" overlay.
- **Hide a kit:** tick **Hidden from shop** → Save. It stays in admin, disappears from the
  site and the sitemap.
- **Move a kit between sections:** tick or untick sections on the kit → Save. A kit can be
  in several at once — a club shirt might sit in its league *and* a cup.
- **Images:** upload through `/admin`. Public product images are restricted to the
  configured Supabase **`kits`** Storage bucket.

### Sections tab
- **Add a section:** name it, pick the menu group, and the URL fills itself in. It appears
  in the nav and gets its own page immediately.
- **Stock a shell:** the leagues, Club Kits, Retro and 26/27 are already there as empty
  sections — an empty one renders a "check back soon" page until you tag kits into it.
- **Reorder:** change the **Order** number — lower shows first within its group.
- **Recolour:** set an accent to tint that section's header bar and card edge. Leave it
  empty for the default navy.
- **Rename vs re-URL:** changing the **name** is free. Changing the **URL** breaks any
  existing link to the old address, so it sits behind a separate "Change URL" button.
- **Delete:** the kits are kept — they just leave that section.

### Elsewhere
- **Change the WhatsApp number:** update `NEXT_PUBLIC_WHATSAPP_NUMBER` in Netlify env vars
  and redeploy (it rarely changes).

## Docs
- [`docs/launch-readiness.md`](docs/launch-readiness.md) — read before every production launch.
- [`docs/session-log.md`](docs/session-log.md) — running history of work sessions, newest first.
- [`docs/rebrand-notes.md`](docs/rebrand-notes.md) — original phase-1 brief for the now-built
  pivot from World-Cup-only to a general replica-jersey reseller.
- [`docs/plans/2026-07-26-referral-and-salespeople.md`](docs/plans/2026-07-26-referral-and-salespeople.md)
  — designed-but-unbuilt referral loop and salesperson attribution. Not started.

> `docs/superpowers/` holds the original 2026-06-09 spec and plan. They describe an abandoned
> **Sanity** architecture and are kept for history only — they do not reflect the current build.
