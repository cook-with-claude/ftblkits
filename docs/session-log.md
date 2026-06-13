# GoalZone — Session Log

A running, detailed log of work sessions. Newest entries at the top.

---

## 2026-06-13 — Real catalog build: 15 kits, photos, descriptions, full verification

**Participants:** Nadim (owner) + Claude Code (Opus 4.8)
**Branch:** `master`
**Outcome:** Live catalog is now 15 real kits with real photos, descriptions, and $25 pricing,
verified end-to-end with Playwright. Committed (`e759717` + docs).

### 1. Identified the kits
Analysed the 15 `PHOTO-*.jpg` files visually (crest, brand, colourway). They map to **8 teams,
mostly home + away**: Spain (H/A), Argentina (H/A), Brazil (H/A), France (H/A), Portugal (H/A),
Germany (H/A), Morocco (H/A), England (H). The old DB had only 5 placeholder products, so this
was a full catalog build, not a 5-row edit.

### 2. Images → Supabase Storage
Created a public **`kits`** bucket. Uploaded all 15 with clean names (`spain-home.jpg`, …) via the
Storage REST API using a **temporary anon-insert policy** (no secret key needed), then dropped that
policy — bucket is now **public-read only**. Public URLs return 200.

### 3. Data + schema
- Added a `description` column to `products`.
- Replaced the 5 picsum placeholders with **15 real products**: name, country, Storage `image_url`,
  `in_stock = true`, and a description (team + kit type + brand + colourway).
- Defaults: **$25** for all (set this session), full **S–XXL** sizes, all in stock — team adjusts
  in the dashboard.

### 4. Code
`description` threaded through the `Product` type, the Supabase query (`COLUMNS` + mapping), and
surfaced on the jersey detail page. Removed the 15 now-redundant `PHOTO-*.jpg` files from the repo.

### 5. Verification (Playwright, mobile viewport 390×844) — 19/19 passed
Drove real Chromium through the full journey: home loads + 15 cards, logo, dark brand bg, **live
search** (brazil→2, no-match→0), card→detail with name/image/price/description, **order CTA disabled
until size picked**, correct `wa.me` link (name + size + price + page URL), **OG title+image** per
jersey, **sold-out overlay** (toggled one out, reverted), malformed id→404, no console errors.
Screenshots confirmed the "Immersive Matchday" look. Also `tsc` clean, 12 unit tests, `npm run build`
green.

### 6. Docs
README updated (description column + `kits` bucket). Added "superseded" banners to the Sanity-era
spec and plan pointing here. This entry added.

### 7. Open items
- **Deploy to Vercel** (still the main next step — needs GitHub + Vercel accounts).
- Per-kit pricing later (all $25 for now, owner's call).

---

## 2026-06-13 — Codex review fix: harden the jersey detail route

**Participants:** Nadim (owner) + Codex review + Claude Code (Opus 4.8)
**Branch:** `master`
**Outcome:** Malformed jersey URLs now return a clean 404 instead of a 500. Committed (`f45122e`).

### 1. Context
Codex ran a full audit + runtime smoke test (terminal checks plus a Playwright-driven browser
pass). Most of what it flagged was environment noise, not code:
- A **500 on `/jersey/[id]`** during testing turned out to be **stale dev-server worker state** —
  cleared by restarting the dev server. Not a code bug.
- A homepage **console error** was just the HMR WebSocket complaining because the page was opened
  as `127.0.0.1` while Next's dev origin is `localhost`. Reopening via `localhost` cleared it.

### 2. The real bug
`/jersey/[id]` accepts arbitrary path text, but Supabase `id` is a **UUID column**. A non-UUID
param (e.g. `/jersey/not-a-uuid`) made Supabase throw on the cast **before** the not-found path
could run → HTTP 500.

### 3. Fix (3 files, +20)
- **`src/lib/ids.ts`** (new): pure `isUuid()` helper with a canonical UUID regex.
- **`src/lib/supabase/queries.ts`**: `getProductById` guards with `if (!isUuid(id)) return null;`
  before querying, so bad ids fall through to the existing not-found page.
- **`tests/catalog.test.ts`**: added `isUuid` tests (accepts canonical UUID; rejects `not-a-uuid`
  and a truncated id).

### 4. Verification
- `npm test` → **12 passing** (was 10; +2 for `isUuid`).
- Runtime (Codex): homepage `200`, valid jersey `200`, malformed jersey now `404` (was 500).
- Working tree clean after commit; Codex's stray Playwright artifact folder was removed.

### 5. Open items
Unchanged from 06-09: deploy to Vercel; stale Sanity-era specs/plans docs; stray `PHOTO-*.jpg`
files in git; replace picsum placeholders with real photos via Supabase Storage.

---

## 2026-06-09 — Project kickoff: brainstorm → spec → plan → build → Supabase pivot → merge

**Participants:** Nadim (owner) + Claude Code (Opus 4.8)
**Branch:** `goalzone-build` → fast-forward merged into `master`
**Outcome:** Working, deployed-ready mobile jersey catalog running on Supabase. Live locally at `http://localhost:3000`.

### 1. Brief
GoalZone ("THE GOAL ZONE — Football Kits") is a Beirut football-kit startup selling replica
national-team jerseys during the 2026 FIFA World Cup window. The site is a **mobile-first
product catalog** reached from Instagram/TikTok bio links. Customers browse, pick a size, and
are handed off to **WhatsApp** to order (payment is cash on delivery or Whish Money — handled in
chat, not on the site). The team (three friends, non-technical) must manage listings and stock
**without touching code**. Brand assets (logo) were provided: bold esports-style emblem, black /
race-red / white palette, athletic type.

### 2. Process followed
Ran the **superpowers brainstorming** skill (visual companion in-browser), then **writing-plans**,
then **subagent-driven-development**. Used the **ui-ux-pro-max** skill for design intelligence.

### 3. Design decisions (brainstorming)
Captured in `docs/superpowers/specs/2026-06-09-goalzone-catalog-design.md`. Key calls:
- **Admin:** visual dashboard (originally Sanity Studio — later changed to Supabase dashboard).
- **Stock:** per-size (originally) — later simplified to whole-product on the Supabase pivot.
- **Kits:** separate Home/Away listings (not variants).
- **Name printing:** none (customers can ask on WhatsApp).
- **Browsing:** filter + search (originally confederation chips + search — later search-only).
- **WhatsApp message:** jersey + size + link prefilled.
- **Stack:** Next.js + Vercel; mobile-first; black/red/white; Anton + Inter fonts.
- **Visual direction chosen:** "Immersive Matchday" (dark, edge-to-edge, TikTok-native) over a
  more structured "Scoreboard Store" alternative.

### 4. Plan
Wrote `docs/superpowers/plans/2026-06-09-goalzone-catalog.md` — 17 bite-sized, TDD-where-applicable
tasks from scaffold through deploy.

### 5. First build (Sanity version) — executed via subagents
Dispatched a fresh implementer subagent per task; verified each. Completed tasks 1–17:
- Scaffolded **Next.js 16** (note: scaffolder pulled 16, not 15; Tailwind v4) on branch `goalzone-build`.
- Installed deps + **Vitest**; wrote pure logic with **TDD** (sold-out, sort, filter, WhatsApp link) — 12 tests green.
- Built Sanity schemas, client, GROQ queries, embedded Studio at `/studio`, brand foundation
  (fonts, tokens, header, OG), JerseyCard, CatalogBrowser, home page, SizePicker, OrderButton,
  jersey detail page, revalidation webhook, README.
- **Final review** (opus subagent) caught and fixed one real bug: missing `images.remotePatterns`
  for `cdn.sanity.io` in `next.config.ts`.
- Blocker reached: creating the live Sanity project needs interactive browser login — handed to user.

### 6. PIVOT — Sanity → Supabase (user decision)
User: "Don't use Sanity. Use Supabase… single products table (jersey name, country, price, sizes,
image, stock status). Rebuild." User authorized using the Supabase MCP directly.

Actions via Supabase MCP:
- Found 3 existing projects; none had a `products` table. User chose to **create a new project**.
- Created project **`goalzone`** (`myhcjdgsnaxwoqazswqe`), region **eu-central-1 (Frankfurt)** —
  chosen for low latency to Beirut. Free tier ($0/mo, confirmed).
- Created `public.products` table:
  `id uuid pk, name text, country text, price numeric, sizes text[], image_url text,
   in_stock boolean, created_at timestamptz`.
- Enabled **RLS** with a **public read-only** policy (anon/authenticated can SELECT; no public
  write — team edits via dashboard, which uses the service role).
- Seeded 5 sample jerseys (Argentina, Brazil, France [sold out], Portugal, Morocco) with
  picsum placeholder images.

Code rework (done directly, not via subagents, since it was a well-understood refactor):
- Removed all Sanity (deps, `src/sanity`, `sanity.config.ts`, `/studio` route, `src/lib/sanity`,
  the revalidate API route). Installed `@supabase/supabase-js`.
- New flat `Product` type; `src/lib/supabase/{client,queries}.ts`; `src/lib/config.ts`
  (WhatsApp number from env + order-message template).
- Reworked `catalog.ts`: whole-product `isSoldOut`, search by name **or** country, in-stock-first
  sort. Updated tests (now 10 passing).
- `whatsapp.ts` tokens changed to `{name} {size} {price} {link}`.
- Components/pages adapted: search-only `CatalogBrowser`, single image, **id-based** detail route
  `/jersey/[id]`, sold-out overlay driven by `in_stock`, WhatsApp number from
  `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Pages set to `force-dynamic` so dashboard edits appear on next page load (replaces the webhook).
- `next.config.ts`: allow any HTTPS image host.

### 7. Design deltas vs. original approved spec (consequences of the flatter schema)
- Whole-product stock (not per-size). Single image (not 1–4). Search-only discovery (no
  confederation chips). Home/Away encoded in `name`. WhatsApp number is an env var (no settings
  doc). No-code admin = Supabase Table Editor. Freshness via dynamic rendering (no webhook).

### 8. Verification (all passing)
- `npx tsc --noEmit` clean (after clearing stale `.next` type cache referencing the deleted studio route).
- `npm test` → 10 passing.
- `npm run build` → succeeds; `/` and `/jersey/[id]` render dynamically.
- Live REST read with the **publishable key** returned all 5 rows (RLS public-read confirmed).
- Dev server server-rendered all 5 jerseys + search + "Sold Out" overlay.

### 9. Wrap-up
- WhatsApp order number set to **96181739109** (+961 81 739 109) in `.env.local`.
- **Merged `goalzone-build` → `master`** (fast-forward; HEAD `022ae9e`).
- Dev server left running in background at `http://localhost:3000`.

### 10. Supabase project reference
- Project: `goalzone` / ref `myhcjdgsnaxwoqazswqe` / region eu-central-1
- URL: `https://myhcjdgsnaxwoqazswqe.supabase.co`
- Publishable key lives in `.env.local` (gitignored). Table: `public.products` (RLS: public read).

### 11. Open items / next steps
- **Deploy to Vercel:** push `master` to GitHub, import, set the 4 env vars (incl.
  `NEXT_PUBLIC_WHATSAPP_NUMBER=96181739109` and prod `NEXT_PUBLIC_SITE_URL`), deploy, add domain to bio.
- **Docs are stale:** `docs/superpowers/specs` and `docs/superpowers/plans` still describe the
  Sanity approach — update to Supabase if desired.
- **Stray photos:** the merge committed ~15 `PHOTO-*.jpg` files from the project folder — decide
  whether these are real jersey photos (move to Supabase Storage) or should be removed from git.
- **Real product images:** replace picsum placeholders with actual jersey photos via Storage.
- Optional: tighten `next.config` image hosts once images are centralized in Supabase Storage.
