# Rebrand Notes — from World Cup store to general replica-jersey reseller

**Status:** planned, not started. Captured 2026-07-26, written up 2026-07-27.
**Owner decision:** the business is pivoting. GoalZone is no longer a World-Cup /
national-team-only store — it becomes a **general replica-jersey reseller** carrying every
kit type: World Cup, national teams, Champions League, domestic club and league kits.

This is a larger, separate effort from the referral + salesperson work in
[`plans/2026-07-26-referral-and-salespeople.md`](plans/2026-07-26-referral-and-salespeople.md).
Nothing here is built yet. **Do not hard-code national-team assumptions into new code.**

The rebrand is mostly **taxonomy + navigation/IA + branding + copy**. It does *not* need a new
commerce backend — keep the WhatsApp-order handoff and the `/admin` panel as they are.

---

## 1. Site structure / IA — the biggest change

Today the storefront is **one long scrolling page**. `src/app/page.tsx` stacks
`Header → Hero → MysteryKits → CatalogBrowser → Footer`, and the only other public route is
`/jersey/[id]`. The "sections" in the nav (`World Cup Kits`, `Shop by Country`, `New Arrivals`)
are **scroll anchors** — `src/components/Header.tsx` links to `/#catalog`, `/#countries`, etc.

The rebrand needs **real multi-section navigation — distinct sections you click into, not one
long scroll.** Plan for:

- **Dedicated routes per section** instead of one page — e.g. `/world-cup`, `/national-teams`,
  `/champions-league`, `/clubs`, or a dynamic `/c/[category]` driven by the new taxonomy — plus a
  slimmer landing page that points into them.
- **A real nav menu** in `src/components/Header.tsx`, linking sections as routes rather than anchors.
- **Browse/filter moves from client-side to route-scoped.** `CatalogBrowser.tsx` currently
  receives *every* product and filters in the browser (search + country chips + in-stock toggle).
  With a much larger catalog that model breaks down; listings should be scoped and queried per
  section instead.
- Section titles become navigation entry points, not scroll targets.

Design the taxonomy (§2) and the route structure together — the categories *are* the sections.

## 2. Data model — `country` is the blocker

`products.country` is a **single free-text column**, and it is doing double duty: it powers the
"Shop by Country" chips (`listCountries` in `src/lib/catalog.ts`) *and* it is half of the search
predicate in `filterProducts`. It assumes every product belongs to a nation.

A club/league catalog does not fit that. A Real Madrid kit has a club, a league, and a
competition — not a country. Options:

- Add explicit columns: `category` / `competition` / `club` / `league`.
- Or a generic `tags text[]` for flexible faceting.

Either way, `listCountries` and the country-only browse UI need to generalize. Touch points:
`src/lib/types.ts` (`Product`), `src/lib/supabase/queries.ts` (`COLUMNS`, `ProductRow`,
`toProduct`), `src/lib/catalog.ts` (`filterProducts`, `listCountries`), `CatalogBrowser.tsx`,
plus the `/admin` add/edit forms (`AddKitForm.tsx`, `KitCard.tsx`) and
`parseProductBody` + `PRODUCT_LIMITS` validation.

**Migration note:** existing rows all have a real country, so a new taxonomy should be additive
(nullable / defaulted) so the 15 live kits keep working while the new fields are backfilled.

## 3. Brand assets and naming

Current name is **"GoalZone" / "The Goal Zone"**, live at `the-goal-zone-kits.netlify.app`.
A rename touches the name, the logo and icon assets (`src/app/icon.png`, `apple-icon.png`,
`public/`), the WhatsApp order message prefix (`ORDER_MESSAGE_TEMPLATE` in `src/lib/config.ts`
opens with `"Hi GoalZone!"`), and all SEO metadata/titles in `src/app/layout.tsx`.

If the domain changes, `NEXT_PUBLIC_SITE_URL` and the Netlify domain config change with it, and
the Google Search Console verification meta tag needs re-issuing.

## 4. Copy — "national-team" is baked into these exact places

Verified 2026-07-27; all need broadening:

| File | What |
|---|---|
| `src/app/layout.tsx:18,21` | metadata + OG description, "Replica national-team jerseys in Beirut" |
| `src/components/Hero.tsx:31` | "FIFA World Cup 2026 · USA · Canada · México" eyebrow |
| `src/components/Hero.tsx:39` | "Replica national-team kits in Beirut" |
| `src/components/Footer.tsx:16` | "Replica national-team kits… themed for the FIFA World Cup 2026" |
| `src/components/Header.tsx:11` | "World Cup Kits" nav label |
| `src/components/Header.tsx:35` | World Cup tri-color motif |
| `src/lib/mystery.ts:2` | "A surprise replica national-team kit…" |
| `src/lib/catalog.ts:46` | comment: "a normal, specific national-team kit" |
| `supabase/migrations/20260711160855_launch_hardening.sql:9,11` | mystery-kit description text normalized in-DB |

The whole visual theme is also World-Cup-specific: `globals.css` uses host-nation colors
(USA navy `#1e2a78` / Canada red `#e10600` / Mexico green `#00a86b`) and a `.gz-flagbar`
tri-color strip. A rebrand away from the tournament likely means a new palette too.

**Keep the word "replica" everywhere.** It is a deliberate legal/accuracy choice recorded in
`docs/launch-readiness.md` (owner sign-off requires all inventory be described as replica
merchandise). Broadening the copy must not quietly drop it.

## 5. Mystery kits

The "surprise **national-team** kit" concept expands to any kit type. There is currently one
mystery tier live (a second "Pro" tier was removed in `3346942`). Consider whether the expanded
catalog wants mystery tiers *per category* (a mystery club kit vs. a mystery national kit) — that
would be a natural fit for the new taxonomy, since mystery rows are just products with
`is_mystery = true`.

## 6. What stays

- WhatsApp-order handoff — no on-site checkout, no cart, no payments.
- The `/admin` panel and its shared-password auth model.
- The single `products` table and Supabase Storage `kits` bucket.
- All the Jul-11 security hardening (RLS, CSP, upload validation, session HMAC).
