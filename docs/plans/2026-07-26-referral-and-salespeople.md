# Plan: Referral Loop + Salesperson Attribution (WhatsApp store)

**Status:** designed 2026-07-26, **not started.** No code, migrations, or tables exist yet.
Ready to execute as written — see *Execution guide* below.

## Scope — two features on one shared mechanism

This plan covers **two related features** that share the same underlying plumbing (a code that rides
from a link → a cookie → into the WhatsApp order message), so build the shared piece once:

- **Part A — Customer referral loop:** buyers share a link; friend and referrer each get 10% off.
- **Part B — Salesperson attribution:** 4 hired salespeople each get a link so their sales are
  attributed to them; owner pays a flat **$2 per kit sold**. Pure attribution, no customer discount.

The two use **separate namespaces** so the site never confuses them: customer referral =
`?ref=` → `gz_ref` cookie (shows the 10%-off banner); salesperson = `?s=` → `gz_src` cookie (no
banner). Both lines can appear in one order with no conflict. Parts A and B can also ship
independently — if only the salesperson feature is wanted first, build the shared plumbing + Part B.

---

## Context

**Why:** The owner wants a referral loop that turns buyers into unpaid advocates — refer a friend who
buys, and both sides get a discount. It costs nothing until it converts, scales word-of-mouth
(football fans live in team/fan group chats), and pulls the referrer back for a repeat order.

**Reward (owner's decisions):**
- **Double-sided percentage, 10% each.**
- **Friend (referred):** 10% off their **first order** — the one placed through the referral link.
  This is the hook that drives the friend to buy now.
- **Referrer (existing buyer who shared):** 10% off their **next order**, unlocked once the friend's
  first order is confirmed paid.
- **Internal cap: $10 max discount per order.** Enforced quietly by the owner; **never shown in the
  public site, banner, or WhatsApp copy** (stating it makes the offer less appealing). Surfaced only
  as guidance inside `/admin`. If a customer asks, the owner can mention it.

**The constraint that shapes everything:** GoalZone ("ftblkits") is **not** a checkout store. It is a
catalog (one Supabase `products` table) + an **"Order on WhatsApp"** deep link. There is **no
payment system, no orders table, no customer accounts, no customer identity, and no on-site total
math** — every sale closes by hand in WhatsApp (cash on delivery, Lebanon). The site never *knows* a
sale happened. Confirmed by README, `docs/superpowers/specs/2026-06-09-goalzone-catalog-design.md:180`
(cart/accounts/payment out of scope), and the schema (only `products` exists).

**Therefore:** no automated "detect sale → issue reward" loop is possible, and it would invite
self-referral fraud. We build a **referral-code + admin-operated discount-reward tracker**. The only
automated pieces are (1) generating/sharing a referral link and (2) auto-attaching the code to the
WhatsApp order. Every money event stays **owner-confirmed** — which is what makes it fraud-safe and
fits how the business already runs. Because there is no on-site total, the 10% (and the $10 cap) are
**applied by the owner in the WhatsApp chat**, where the total is calculated anyway.

**Outcome:** Owner creates a personal referral link per buyer from `/admin`; the code rides into
referred friends' WhatsApp orders automatically; the friend sees a "10% off your first order" banner;
the owner confirms paid referrals and tracks/redeems the referrer's 10% reward from a new admin panel.

---

## Design overview

- **The referral code is the identity** (no customer accounts exist). Owner-generated in `/admin`.
- **Shareable link:** `SITE_URL/?ref=CODE`. A visitor arriving with `?ref=` gets the code stored in a
  cookie; it is then appended to any WhatsApp order as a `Referred by: CODE` line, and a banner tells
  the friend they get **10% off their first order** (no cap mentioned).
- **Reward = a discount entitlement, not a dollar balance.** Each successful referral yields exactly
  one "10% off one order" reward for the referrer. The friend's 10% is applied inline on their first
  order (no stored balance — the friend has no account) and recorded for the books at confirm time.
- **Referral tables are private** (RLS, no public policies). The public site treats the code as an
  opaque string it echoes into the WhatsApp message — no public DB read, zero data exposure.
- **Owner workflow:** friend orders via link → owner applies up to 10%/$10 off and collects payment →
  owner logs the referral in `/admin` and Confirms it → the referrer's 10% reward becomes *available*
  → when the referrer later orders, owner applies their 10%/$10 off and marks the reward *redeemed*.

---

## Data model — new migration `supabase/migrations/<ts>_referrals.sql`

Follow the RLS style of `supabase/migrations/20260711160855_launch_hardening.sql` exactly: enable
RLS, **no public policies**, `revoke all ... from anon, authenticated` (service-role bypasses RLS, so
admin routes still work). Add CHECK constraints like the products migration.

- **`referrers`**: `id uuid pk default gen_random_uuid()`, `code text unique not null`,
  `label text not null` (name/handle so the owner recognizes them), `whatsapp text`,
  `active boolean not null default true`, `created_at timestamptz not null default now()`.
- **`referrals`** (one row per referred sale = one referrer reward):
  - `id uuid pk`, `referrer_id uuid not null references referrers(id) on delete cascade`
  - `referee_label text` (who the friend is, owner-entered)
  - `status text not null default 'pending' check (status in ('pending','confirmed','void'))`
    — the friend's first order: pending until the owner confirms it was paid
  - `referee_discount_usd numeric check (referee_discount_usd >= 0)` — $ the friend actually got off
    their first order (≤ cap), recorded at confirm time for the books
  - `reward_status text not null default 'locked' check (reward_status in ('locked','available','redeemed','void'))`
    — the referrer's 10%-off reward lifecycle: `locked` until the referral is confirmed → `available`
    → `redeemed` when the referrer uses it
  - `reward_discount_usd numeric check (reward_discount_usd >= 0)` — $ the referrer got off when they
    redeemed (≤ cap), recorded at redemption
  - `note text`, `created_at timestamptz default now()`, `confirmed_at timestamptz`, `redeemed_at timestamptz`
- **`referrer_rewards_summary`** view: per `referrer_id`, counts of `available` / `pending` (locked on
  a pending referral) / `redeemed` rewards, for the admin list.

Applied via the Supabase MCP (`apply_migration`) / SQL editor — the base `products` table was
likewise created outside committed migrations.

---

## Backend — config + new admin API routes

**Config** — new `src/lib/referrals.ts` (shared, no server-only imports), env-overridable like
`src/lib/config.ts`:
- `REF_COOKIE = "gz_ref"`
- `REFERRAL_PERCENT = 10` (both sides)
- `REWARD_MAX_CAP_USD = 10` — **internal only; never rendered in any public component**
- `generateReferralCode()` (6-char unambiguous base32) and `isValidRefCode()`
- Public-facing copy helper(s) that mention only "10% off" — never the cap.

**Admin API routes** (mirror `src/app/api/admin/products/route.ts`): each is `runtime="nodejs"`,
`dynamic="force-dynamic"`, guarded by `requireAdmin(req)` + (mutations) `requireSameOrigin(req)` from
`src/lib/admin/server.ts`, using `getAdminClient()` from `src/lib/supabase/admin.ts`; reuse `isUuid`
from `src/lib/ids.ts`.
- `src/app/api/admin/referrers/route.ts` — **GET** referrers joined with `referrer_rewards_summary`;
  **POST** create a referrer (generate a unique code, retry on collision).
- `src/app/api/admin/referrers/[id]/route.ts` — **PATCH** edit `label`/`whatsapp`/`active`.
- `src/app/api/admin/referrals/route.ts` — **GET** referrals (esp. pending); **POST** log a referred
  sale (creates a `pending` referral for a code's referrer).
- `src/app/api/admin/referrals/[id]/route.ts` — **PATCH** transitions: confirm (records
  `referee_discount_usd`, sets `reward_status='available'`), redeem (records `reward_discount_usd`,
  `reward_status='redeemed'`), or void. Server clamps recorded discounts to `REWARD_MAX_CAP_USD`.

New helper `src/lib/admin/referrals.ts`: `parseReferrerBody` / `parseReferralBody` /
`parseTransitionBody` validation+coercion, mirroring `parseProductBody` in `src/lib/admin/server.ts`
(bounds on label/whatsapp/note, non-negative discounts clamped to the cap, valid status transitions).

---

## Admin UI — add a "Referrals" section to `/admin`

`src/components/admin/AdminDashboard.tsx` is currently a single "Manage Kits" screen. Add a top nav
toggle **Kits | Referrals** and render a new panel. New components under `src/components/admin/`:
- `ReferralsPanel.tsx` — fetches referrers (+summary) and pending referrals; top-level view.
- `AddReferrerForm.tsx` — create a referrer (label + optional WhatsApp) → shows the generated **share
  link** `SITE_URL/?ref=CODE` with a copy button (the one-click "after every sale, offer it" step).
- `ReferrerCard.tsx` — shows code, share link (copy), **available-rewards count**, and this referrer's
  referrals with actions: **Log referred sale** (enter friend's label → creates pending referral) →
  **Confirm** (enter the $ you gave the friend off their first order; the card shows the internal
  "10%, max $10" guidance and clamps to it) → **Redeem reward** (enter the $ you gave the referrer
  off their next order; same guidance/clamp) → **Void**.
- Extend `src/components/admin/api.ts` with fetch wrappers (mirror existing `fetchProducts` etc.).
- The **$10 cap appears only here**, as helper text ("10% off, up to $10"), never in public UI.

Reuse existing admin styling/patterns (`KitCard.tsx` is the reference for a card with inline actions).

---

## Customer-facing UX (double-sided, minimal)

1. **Capture `?ref=CODE`:** new client component `src/components/RefCapture.tsx` mounted in
   `src/app/layout.tsx`. On mount it reads `location.search` for `ref`, validates via `isValidRefCode`,
   writes the `gz_ref` cookie (30-day), and cleans the URL. (Cookie persistence is required because the
   order button lives on the jersey detail page, reached by navigation without the query param.)
2. **Attach to the order:** `src/app/jersey/[id]/page.tsx` (server component, already `force-dynamic`)
   reads the `gz_ref` cookie via `next/headers` `cookies()` and passes `refCode` to the order button.
   Extend `OrderVars` + `ORDER_MESSAGE_TEMPLATE` in `src/lib/whatsapp.ts` / `src/lib/config.ts` with a
   `{referral}` token (defaults to `""`, same pattern as the existing `{notes}` token) → appends
   `\nReferred by: CODE — 10% off first order`. **No cap in the text.** Update
   `src/components/OrderButton.tsx` to pass `refCode` through.
3. **Referral banner:** `src/components/ReferralBanner.tsx` — when `gz_ref` is present, show a slim
   banner ("🎁 You've been referred — get **10% off your first order**") on the catalog
   (`src/app/page.tsx`) and jersey pages. **No mention of the $10 cap.**
4. **Optional explainer:** a static `/refer` page + Footer link ("Refer a friend — you both get 10%
   off"). Nice-to-have; primary distribution is the owner DMing each buyer their personal link. No cap.

**Fraud/margin guardrails (rules + owner-enforced):** the referrer's reward is `locked` until the
owner confirms the friend's order was paid (no auto-liability); the owner eyeballs referee ≠ referrer
before confirming; the 10% and the $10 cap are applied by the owner in WhatsApp and the server clamps
any recorded discount to `REWARD_MAX_CAP_USD`; percentage naturally protects margin on cheap kits.
All values live in `src/lib/referrals.ts` for easy tuning.

---

## Tests (Vitest — extend `tests/`)

- `buildOrderMessage` includes the `Referred by: CODE — 10% off first order` line when a code is
  passed, and omits it cleanly (no stray newline) when absent. Mirror the existing WhatsApp test.
- `generateReferralCode` format + `isValidRefCode` accept/reject cases.
- `parseReferralBody` / `parseTransitionBody`: valid transitions, discount clamped to the $10 cap,
  rejects bad status/negative amounts — mirror the `parseProductBody` tests.
- Reward summary counting: available vs pending(locked) vs redeemed.
- A copy-safety test asserting the public banner/message strings contain "10%" but **not** the cap
  figure, so the internal cap can't leak into public UI.

---

## Verification (end-to-end)

1. Apply the migration (Supabase MCP `apply_migration`); confirm tables + view + RLS with
   `list_tables` / `get_advisors` (expect no "RLS disabled" / exposed-table advisories).
2. `npm test` and `npm run build` pass.
3. Browser walk-through (`npm run dev`): log into `/admin` → Referrals → create a referrer → copy the
   share link → open `/?ref=CODE` (banner shows "10% off your first order", no cap; cookie set; URL
   cleaned) → open a kit → confirm the WhatsApp link contains `Referred by: CODE — 10% off first
   order` and no cap text → in admin, Log the referred sale → Confirm (record friend's discount) →
   referrer's reward flips to *available* → Redeem it → reward flips to *redeemed*.
4. Direct-REST check: an anon Supabase call to `referrers`/`referrals` returns no rows (RLS),
   confirming contacts and reward data are private.

---

## Part B — Salesperson attribution (per-rep links + flat $2/kit commission)

**Why:** The owner hired 4 salespeople paid a **flat $2 per kit sold**. Each needs a personal link so
sales they drive are attributed automatically, and the owner needs a per-person tally of kits sold →
commission owed → paid/unpaid. **Pure attribution: the salesperson's customers get NO discount**
(owner-decided). Commission is per **kit**, not per order or per revenue — so track kit count.

**Shared plumbing (reused from Part A — build once):** the `code → cookie → WhatsApp line` mechanism,
under a separate namespace so attribution is never mistaken for a referral discount:
- Link `SITE_URL/?s=RYAN` → stored in `gz_src` cookie (30-day) by the **same** `RefCapture` component
  (extend it to persist both `?ref=` and `?s=`).
- The WhatsApp order gains a `Sold by: RYAN` line via a new `{source}` token in
  `ORDER_MESSAGE_TEMPLATE` (same pre-formatted-line-or-`""` pattern as `{notes}`/`{referral}`).
- **No banner** on `?s=` links (pure attribution); optional subtle neutral touch only.
- Salesperson codes are **owner-chosen vanity strings** (`RYAN`, `SARA`), uppercased and validated
  unique, so they're instantly recognizable in WhatsApp. (Customer referral codes stay random — a
  separate table.)

**Data model** — extend the `_referrals.sql` migration (or a sibling `_salespeople.sql`), same RLS
style as Part A (private, no public policies, `revoke all from anon, authenticated`):
- `salespeople`: `id uuid pk default gen_random_uuid()`, `code text unique not null` (uppercase
  vanity), `name text not null`, `whatsapp text`, `active boolean not null default true`,
  `per_kit_rate_usd numeric not null default 2` (overridable per person),
  `created_at timestamptz not null default now()`.
- `sales` (one row per attributed sale, owner-logged): `id uuid pk`,
  `salesperson_id uuid not null references salespeople(id) on delete cascade`,
  `kits_count int not null default 1 check (kits_count >= 1)`, `item_label text` (optional, e.g.
  "Argentina Home ×2"), `amount_usd numeric check (amount_usd >= 0)` (optional revenue note),
  `paid boolean not null default false` (commission settled?), `note text`,
  `created_at timestamptz not null default now()`.
- `salesperson_totals` view: per salesperson — `sales_count`, `total_kits = Σ kits_count`,
  `commission_owed = total_kits × per_kit_rate_usd`, and `unpaid_kits` / `unpaid_commission`
  (rows where `paid = false`).

**Backend routes** (mirror `src/app/api/admin/products/route.ts` + the Part A guards
`requireAdmin`/`requireSameOrigin` + `getAdminClient()`):
- `src/app/api/admin/salespeople/route.ts` — GET (join `salesperson_totals`); POST (create; validate
  code uppercase/format, 409 on collision since codes are owner-chosen).
- `src/app/api/admin/salespeople/[id]/route.ts` — PATCH (edit name/whatsapp/active/rate).
- `src/app/api/admin/sales/route.ts` — GET (recent sales, filterable by salesperson); POST (log a
  sale: `salesperson_id` + `kits_count` + optional `item_label`/`amount_usd`/`note`).
- `src/app/api/admin/sales/[id]/route.ts` — PATCH (mark paid/unpaid, edit), DELETE.
- Validation helper `src/lib/admin/salespeople.ts` (mirror `parseProductBody`): code format,
  `kits_count ≥ 1`, non-negative amount, bounds on name/label/note.

**Admin UI** — third tab so the nav is **Kits | Referrals | Salespeople**. New components under
`src/components/admin/`:
- `SalespeoplePanel.tsx` — list salespeople with total kits, commission owed, and unpaid amount.
- `AddSalespersonForm.tsx` — create (name + chosen code + optional rate) → shows the share link
  `SITE_URL/?s=CODE` with a copy button.
- `SalespersonCard.tsx` — code, share link (copy), totals (kits / $ owed / $ unpaid), the person's
  sales list with **Log sale** (kit count + optional item/amount) and **Mark paid** actions.
- Extend `src/components/admin/api.ts` with fetch wrappers.

**Config additions** (`src/lib/referrals.ts`, or split shared bits into `src/lib/attribution.ts`):
`SALES_PARAM = "s"`, `SALES_COOKIE = "gz_src"`, `PER_KIT_COMMISSION_USD = 2` (default rate), cookie
TTL 30 days.

**Customer UX:** extend `RefCapture` to also persist `?s=` → `gz_src`; `src/app/jersey/[id]/page.tsx`
reads both cookies and passes `refCode` + `sourceCode` to `OrderButton`; `buildOrderMessage` appends
the `Sold by:` line when `sourceCode` is present. No banner for salesperson links.

**Owner workflow:** hand each salesperson their `?s=CODE` link → customer orders through it → the
WhatsApp order shows `Sold by: RYAN` → owner closes the sale → `/admin → Salespeople → Ryan → Log
sale` (enter kit count) → tally updates, commission owed = kits × $2 → owner pays out and hits **Mark
paid** (unpaid figure drops). Attribution is only as honest as what the owner logs, and a salesperson
can't inflate their count without a real WhatsApp order carrying their code.

**Tests (Part B):** `buildOrderMessage` includes `Sold by: CODE` when a source code is passed and
omits it cleanly otherwise; salesperson code validation (uppercase/format/collision); `parseSaleBody`
(`kits_count ≥ 1`, non-negative amount); `salesperson_totals` math (kits × rate, unpaid subset).

---

## Execution guide (ordered steps for a fresh session)

Do these in order. Each step is independently testable. **Shared plumbing (steps 3, 7, 8) serves
both Part A and Part B — build it once.** If you only want salespeople first, do the shared plumbing +
Part B steps (marked ⓑ) and skip the referral-only steps (marked ⓐ).

1. **Branch.** `git checkout -b feat/referral-and-sales` (repo default branch is `master`).
2. **Migration.** Write `supabase/migrations/<timestamp>_referrals.sql` covering **both** Part A
   tables (`referrers`, `referrals`, `referrer_rewards_summary`) and Part B tables (`salespeople`,
   `sales`, `salesperson_totals`) — or two sibling migrations. Apply via Supabase MCP
   `apply_migration` (or SQL editor). Run `get_advisors`; fix any RLS/exposed-table warnings.
3. **Shared config + helpers.** Create `src/lib/referrals.ts` (and optionally `src/lib/attribution.ts`
   for the shared bits): `REF_COOKIE`/`SALES_COOKIE`, `SALES_PARAM`, `REFERRAL_PERCENT`,
   `REWARD_MAX_CAP_USD` (internal), `PER_KIT_COMMISSION_USD`, `generateReferralCode`, `isValidRefCode`,
   salesperson-code validation, public-copy helpers that never mention the cap.
4. **Admin validation helpers.** ⓐ `src/lib/admin/referrals.ts` (`parseReferrerBody`,
   `parseReferralBody`, `parseTransitionBody`); ⓑ `src/lib/admin/salespeople.ts` (`parseSalespersonBody`,
   `parseSaleBody`) — all mirroring `parseProductBody`.
5. **Admin API routes.** Copy the guard/shape of `src/app/api/admin/products/route.ts` +
   `.../products/[id]/route.ts` verbatim. ⓐ `referrers/**`, `referrals/**`. ⓑ `salespeople/**`,
   `sales/**`.
6. **Admin UI.** Add the **Kits | Referrals | Salespeople** nav toggle to `AdminDashboard.tsx`.
   ⓐ `ReferralsPanel.tsx`, `AddReferrerForm.tsx`, `ReferrerCard.tsx`. ⓑ `SalespeoplePanel.tsx`,
   `AddSalespersonForm.tsx`, `SalespersonCard.tsx`. Extend `src/components/admin/api.ts` for both.
7. **Order attachment.** Extend `OrderVars`/`ORDER_MESSAGE_TEMPLATE` (`src/lib/whatsapp.ts`,
   `src/lib/config.ts`) with **both** tokens `{referral}` (ⓐ) and `{source}` (ⓑ); thread `refCode` +
   `sourceCode` through `src/components/OrderButton.tsx` and read both cookies in
   `src/app/jersey/[id]/page.tsx`.
8. **Capture + banner.** Create `src/components/RefCapture.tsx` (mount in `src/app/layout.tsx`) — it
   persists **both** `?ref=`→`gz_ref` and `?s=`→`gz_src`. ⓐ `src/components/ReferralBanner.tsx`
   (render in `src/app/page.tsx` + jersey page); ⓑ no banner for `?s=`.
9. ⓐ **Optional `/refer` page** + Footer link.
10. **Tests** (see Tests for both parts), then `npm test` and `npm run build`.
11. **Env (optional overrides).** If any reward/commission value is env-driven, add it to
    `.env.example` and Netlify (mirror `src/lib/config.ts`). Reminder from prior memory: Netlify
    `is_secret` env vars do NOT reach the Next.js function at runtime — use non-secret vars.

## File manifest

**New files — shared**
- `supabase/migrations/<ts>_referrals.sql` (both parts' tables + views)
- `src/lib/referrals.ts` (+ optional `src/lib/attribution.ts` for shared cookie/param/code bits)
- `src/components/RefCapture.tsx` (persists both `?ref=` and `?s=`)
- Test files under `tests/`

**New files — Part A (referral)**
- `src/lib/admin/referrals.ts`
- `src/app/api/admin/referrers/route.ts`, `src/app/api/admin/referrers/[id]/route.ts`
- `src/app/api/admin/referrals/route.ts`, `src/app/api/admin/referrals/[id]/route.ts`
- `src/components/admin/ReferralsPanel.tsx`, `AddReferrerForm.tsx`, `ReferrerCard.tsx`
- `src/components/ReferralBanner.tsx`, `src/app/refer/page.tsx` (optional)

**New files — Part B (salespeople)**
- `src/lib/admin/salespeople.ts`
- `src/app/api/admin/salespeople/route.ts`, `src/app/api/admin/salespeople/[id]/route.ts`
- `src/app/api/admin/sales/route.ts`, `src/app/api/admin/sales/[id]/route.ts`
- `src/components/admin/SalespeoplePanel.tsx`, `AddSalespersonForm.tsx`, `SalespersonCard.tsx`

**Modified files**
- `src/components/admin/AdminDashboard.tsx` (Kits | Referrals | Salespeople nav),
  `src/components/admin/api.ts`
- `src/lib/whatsapp.ts`, `src/lib/config.ts` (add `{referral}` + `{source}` tokens)
- `src/components/OrderButton.tsx`, `src/app/jersey/[id]/page.tsx` (thread `refCode` + `sourceCode`)
- `src/app/layout.tsx` (mount `RefCapture`), `src/app/page.tsx` (render referral banner)
- `src/components/Footer.tsx` (optional `/refer` link), `.env.example` (optional)

## Key existing-code references (so no re-exploration is needed)

- **WhatsApp order builder** — `src/lib/whatsapp.ts`: `buildOrderMessage(template, vars)` does
  `.replaceAll("{token}", …)`; `OrderVars` = `{name, size, quantity, notes}`. Template in
  `src/lib/config.ts`: `ORDER_MESSAGE_TEMPLATE = "Hi GoalZone! I'd like to order:\n{quantity}x {name}
  — Size {size}.{notes}"`. The `{notes}` token is pre-formatted (a full extra line or `""`) — copy
  that exact pattern for `{referral}`.
- **Order button** — `src/components/OrderButton.tsx`: client component, builds the `wa.me` href from
  `WHATSAPP_NUMBER` + template; only appends its mystery "Special request" line when present. Add a
  `refCode` prop and build the referral line the same way.
- **Admin auth guards** — `src/lib/admin/server.ts`: `requireAdmin(req)` (401 if no valid cookie),
  `requireSameOrigin(req)` (403 CSRF guard, proxy-aware). Every admin route calls these.
- **Service-role client** — `src/lib/supabase/admin.ts`: `getAdminClient()` bypasses RLS; import only
  in `/api/admin/*` (it's `server-only`).
- **Route template** — `src/app/api/admin/products/route.ts` + `.../products/[id]/route.ts`:
  `runtime="nodejs"`, `dynamic="force-dynamic"`, guard → parse body → `getAdminClient()` →
  insert/update `.select(COLUMNS).single()` → `NextResponse.json`. Reuse verbatim.
- **Validation template** — `parseProductBody` in `src/lib/admin/server.ts`: `has(k)` presence checks,
  bounds from `PRODUCT_LIMITS` (`src/lib/admin/validation.ts`), `partial` (PATCH) vs full (POST).
- **RLS-hardening pattern** — `supabase/migrations/20260711160855_launch_hardening.sql`: `enable row
  level security`, drop public SELECT policies, `revoke ... from anon, authenticated`, add `not valid`
  CHECK constraints. New tables: same style but grant NOTHING to anon/authenticated (fully private).
- **Admin dashboard** — `src/components/admin/AdminDashboard.tsx`: `"use client"`, fetches on mount,
  `upsert/prepend/drop` local state helpers, sticky header with View shop / Log out. Add the nav
  toggle here. `src/components/admin/KitCard.tsx` is the card-with-inline-actions reference.
- **ID util** — `src/lib/ids.ts`: `isUuid(value)`. **Cookies** — read server-side via `next/headers`
  `cookies()`; the admin cookie name pattern lives in `src/lib/admin/constants.ts` (`gz_admin`), so
  use `gz_ref` to match the `gz_` prefix convention.

## Defaults (tune before launch against real per-kit margin)

**Part A (referral):** `REFERRAL_PERCENT = 10` · `REWARD_MAX_CAP_USD = 10` (internal, never public) ·
`REF_COOKIE = "gz_ref"` · referral code = 6-char unambiguous base32 (random).
**Part B (salespeople):** `PER_KIT_COMMISSION_USD = 2` (per-person overridable) · `SALES_PARAM = "s"` ·
`SALES_COOKIE = "gz_src"` · salesperson code = owner-chosen uppercase vanity (e.g. `RYAN`).
**Shared:** cookie TTL 30 days.

## Note for memory / context

The prior memory hint about a "rep/reseller" concept was a **false trail** — "rep" in this repo means
"**replica**" kits, not sales reps. There is no existing referral/rep/commission/credit code, no
orders table, and no customer accounts. This feature is entirely net-new but built on the existing
admin + Supabase patterns above.

## Broader context — upcoming FULL REBRAND (heads-up, not part of this build)

The owner is pivoting the whole business: **no longer World-Cup / national-team only.** The store is
becoming a **general replica-jersey reseller selling every kit type** — World Cup, national teams,
Champions League, domestic club/team kits, etc. That is a separate, larger effort, written up in
**[`../rebrand-notes.md`](../rebrand-notes.md)**.

It matters here only as a constraint: **don't hard-code national-team assumptions into the
referral/salesperson code.** Nothing in this plan depends on the catalog taxonomy, so the two efforts
can proceed in either order.

## How to resume

Open a new session in this repo and say: *"Execute the plan in
`docs/plans/2026-07-26-referral-and-salespeople.md`."* Everything needed to build it without
re-exploring is in this document.

---

## Explicitly out of scope (per "lean" decision)

Customer self-serve accounts/login, customer-visible reward status, email/SMS notifications,
automated sale detection, and on-site checkout/total math. These need net-new customer identity + an
orders table + payment layer and still couldn't auto-detect WhatsApp sales. Revisit only if the store
later adds an on-site checkout.

**Note — salesperson logins (deliberately out of scope, owner-confirmed):** all four salespeople share
the single existing `/admin` password, and only the owner views the tallies. Per-salesperson logins
(so each rep sees only their own numbers) are **not** being built now — that requires a real staff
identity/auth layer the app doesn't have (today `/admin` is one shared HMAC-cookie password, see
`src/lib/admin/auth.ts`). The owner has accepted the shared-password model. Flag this only if reps
later need self-serve dashboards.
