# Response to the external UI/UX audit — verified plan

**Status:** built on branch `feat/audit-response`, 2026-08-13. Written 2026-08-12.

> **All five phases are done and verified.** Phase A was applied to production on
> 2026-08-13 on the owner's instruction, after a read-only dry run confirmed every
> figure below. Post-migration counts came out exactly as predicted:
> `retro ∩ leagues` 0 → 233, `/kits/premier-league` 67 → 124, seasonless names
> 154 → 16, with no duplicate slugs, nothing over the 12-slug cap, and the 40
> retro∩country memberships untouched.
>
> Rollback SQL for both is in the session scratchpad. It is exact rather than
> approximate, because the preconditions were verified immediately before the
> writes: every tagged row was `{retro-kits, club-kits}` beforehand, and every
> renamed row contained no digit at all. Note the retro rollback must strip only
> the 11 league slugs — a blanket reset would delete 40 legitimate country
> memberships.
>
> Changes made to the plan while building it, and why:
> - **`/kits` no longer shuffles server-side.** An explicit "Newest" sort has to
>   be able to recover arrival order, which a shuffle applied before the filter
>   panel had already destroyed. The mixing moved into `CatalogFilters` behind a
>   `mixed` prop; the reason for mixing is unchanged.
> - **Pagination is a "Show more" reveal, not numbered pages.** Filtering here is
>   instant and local, so a page control would reset the grid on every keystroke.
>   Same goal — 48 cards rendered instead of 687.
> - **The nav moved from `lg:` to `xl:`.** Measured, the row is 908px wide against
>   947px of space at 1280px. It cannot fit at 1024px at any padding, so below xl
>   the drawer — which was already built — is the honest answer. Group labels are
>   shortened for the header only (`NAV_GROUP_SHORT_LABELS`); `/admin` keeps the
>   long forms.
> - **Section pages are prerendered** via `generateStaticParams`, which the plan
>   did not call for but which E2 made free.
> - **The delivery answer is two weeks, not days.** Kits are ordered from the
>   supplier in batches rather than per customer. Owner-confirmed 2026-08-13; it
>   is now the first thing the product page says.
**Source:** black-box UI/UX audit of production dated 2026-08-09, no repo access.
**Scope agreed:** the verified P0 + P1 tier. Analytics excluded by owner decision.

---

## Context

A friend produced a black-box UI/UX audit of the production site on 9 Aug 2026. It is a
genuinely good report, but it was written without repo access, so every claim needed
checking against source and against the live database before we spend effort on it.

All of it was verified. The headline findings hold — one of them almost perfectly — but a
few claims are wrong, one describes a feature that has shipped since July, and one item the
audit filed under "working well" is actually a gap.

**Goal:** make the 368 retro kits reachable, unblock the mobile conversion path, and give a
first-time buyer enough information to press send — without re-doing work that already
exists in the codebase.

---

## What the audit got right, wrong, and missed

### Confirmed — including one near-perfect call

Queried live (`products`, `hidden = false`) on 2026-08-12:

| Audit claim | Reality |
|---|---|
| 368 retro @ $34.99, 318 modern @ $29.99 | **Exact** (plus 1 mystery box row @ $26.99; 687 total, not 686) |
| `retro-kits ∩ any of 11 league sections` = 0 | **Exact — 0** |
| `retro-kits ∩ any of 8 country sections` = 40 | **Exact — 40** |
| 57 Premier League retro shirts orphaned | **Exact — 57** |
| `inStock:false` occurs 0 times | **Exact — 0** |
| ~155 products with no season in the name | **153** |

Also confirmed in source: no size chart, no returns/delivery copy, no `/about` `/contact`
`/faq`, no reviews, no JSON-LD, no sort control anywhere, no header search, no
`whitespace-nowrap` anywhere, the CTA bar is `fixed` with no breakpoint guard and no
`env(safe-area-inset-bottom)`, the WhatsApp header button is `hidden … sm:flex`, and
`buildCartMessage` carries no product link — with a test at `tests/whatsapp.test.ts:38`
actively locking that in.

### Wrong

- **P0-2 "adding to cart produces no visible response at all" — false.**
  `src/components/OrderButton.tsx:79-92` renders a green *"Added to cart · View cart"*
  inside an `aria-live="polite"` region. It shipped in `f209748` on **2026-07-27**, twelve
  days before the audit. The real (smaller) defect: it sits inside the fixed bar — the most
  occluded zone on mobile — auto-dismisses after 2500 ms, and the button label never changes.
- **"`toast(` is called exactly once" — it is called twice**, and `"success"` does appear in
  `src/lib/toast.ts`. The half that survives is real: no call site ever passes the success
  tone, so the green branch is unreachable.
- **Every source-level count is inflated** — 6128 hover utilities (actual: 86), 816 font
  sizes (190), 92 focus rings (13), 23 magenta uses (3). These are *rendered-DOM* counts
  across a 687-card page, not code counts, so they are not errors so much as a different
  vantage point — but they make the work sound ~10x bigger than it is.
- **`active:scale-[0.98]` does not exist** in source or built CSS.
  (`-webkit-tap-highlight-color: transparent` *does* ship — it comes from Tailwind v4's
  preflight, `node_modules/tailwindcss/preflight.css:45`, not from our code. That claim was
  fair.)

### Missed

- **"Per-product Open Graph and Twitter tags are present and correct" is filed under
  *working well* — it is actually a gap.** There are **zero** Twitter tags in the repo, and
  `openGraph` at `jersey/[id]/page.tsx:27` sets only `title` + `images`. Next *replaces*
  rather than deep-merges `openGraph`, so the root's description/type/url do not backfill.
  Since WhatsApp group shares are a primary discovery channel, this matters.
- **The WhatsApp-unfurl worry is unfounded.** `og:image` is the raw Supabase original, never
  a `/_next/image` variant, so an unfurler never sees the 3840 srcset entry. The `src`
  fallback observation is correct but harmless.
- **HTML is uncached, but the data is not.** Every read is wrapped in `unstable_cache`
  (`queries.ts:40-66`, `revalidate: 300`, tag-purged on admin write via
  `src/lib/cache-tags.ts`). The DB round-trip is already shared; only the render is repeated.
- **The season is recoverable, contrary to the audit's framing.** There is no `season`
  column — but **138 of the 153 seasonless names are tagged `25-26-kits`**, and **80 teams
  currently list a seasonless kit beside a seasoned one** ("Arsenal Home" next to
  "Arsenal 26/27 Home"). The audit's example was real; the fix is a data backfill, not a UI
  change.

---

## The work

### Phase A — Data (highest impact, no UI risk)

**A1 · Tag retro kits into their leagues.** New migration in `supabase/migrations/`.
Join each retro kit's `team` to the league slugs its modern counterparts already sit in,
and append deduped. Verified reach: **225 of 368 auto-tag**, distributed
`champions-league 83 · premier-league 57 · la-liga 54 · serie-a 36 · bundesliga 29 ·
europa-league 21 · ligue-1 17 · primeira-liga 13 · eredivisie 10 · mls 8 · saudi-pro-league 1`.

Constraints to respect (`20260727135000_enforce_section_membership_integrity.sql`): max 12
slugs, no duplicates, every slug must exist. Worst case here is 5 slugs, so we are safe —
but the `update` must `array_agg(distinct …)`, not concatenate blindly.

Four club teams have no modern counterpart and need an explicit mapping: **Auxerre,
Monaco, Strasbourg → `ligue-1`; FC Dallas → `mls`** (8 kits).

The remaining 135 are national teams; 95 of them belong to countries with no section at all
(Italy, Netherlands, Croatia, Japan, Mexico…). Creating 30 sections would take the "Shop by
Country" dropdown from 8 to 38 — **out of scope**, flagged below.

**A2 · Backfill the season into 138 kit names.** Rename `<Team> <Variant>` →
`<Team> 25/26 <Variant>` for the 138 seasonless kits tagged `25-26-kits`. This is the
convention the README already mandates ("the season is part of every kit's name and slug"),
and it fixes the card, the page title and the WhatsApp message body in one write. Leave the
15 `world-cup-2026` national-team shirts alone — those genuinely have no season.

> After both migrations the storefront can serve stale data for up to 5 minutes
> (`unstable_cache` revalidate: 300). Either wait it out or trigger the existing tag purge.

### Phase B — Conversion path

**B1 · Stop the fixed bar covering the size picker** — `src/components/OrderButton.tsx:75`.
Render the CTA inline in the details column beneath `SizePicker`, and keep the fixed bar on
mobile only, revealed by an `IntersectionObserver` once the inline CTA scrolls out of view.
Drop the fixed bar entirely at `md:` and up (returns 14% of the desktop viewport). Add
`padding-bottom: env(safe-area-inset-bottom)`. Mirror the change in
`jersey/[id]/loading.tsx:45`, which duplicates the bar's classes verbatim, and make the
page's `pb-28` (`jersey/[id]/page.tsx:46`) conditional.

**B2 · Green CTA from first paint, and fix the a11y hole** — `OrderButton.tsx:108-121`.
Today the WhatsApp element is an `<a>` whose `href` is `undefined` while disabled: it maps
to role `generic`, ignores `aria-disabled`, and is not focusable — so the action bar has
**zero tabbable elements** until a size is picked. Render a real `<button>` in WhatsApp green
from first paint; on click without a size, scroll to the size row and announce *"Pick a size
first"*. Swap to the `<a href>` once a size exists. Reuse the existing `aria-live` region at
`:79` (give the hint and the add-confirmation separate slots so they cannot clobber each other).

**B3 · Put the product link and a delivery template in the WhatsApp message** —
`src/lib/cart.ts:130-143`. The id is already on the record (`cart.ts:7`); append
`${SITE_URL}/jersey/${line.id}` per line, and add a `Name: / Area: / Phone:` block so the
owner stops opening every order by asking. This is the single biggest lift to *their*
workload. **`tests/whatsapp.test.ts:38-40` asserts the link is absent and must be inverted**;
several `tests/cart.test.ts` message assertions will need updating too.

**B4 · Size chart.** New `src/lib/sizing.ts` holding two tables — modern and retro, since
1980s–90s patterns run differently — with chest-flat and body-length per size, **clearly
labelled approximate** and paired with an honest *"these run small; size up if you're
between."* Surface it as a link beside "Select size", opened in a dialog. Reuse the modal
pattern already proven in `src/components/cart/CartPanel.tsx` (`role="dialog"`,
`aria-modal`, focus trap, focus restoration, scroll lock) rather than writing a new one.

> Owner decision 2026-08-12: use published typical Asian-replica measurements, clearly
> labelled approximate, rather than blocking on measuring real stock. Replace with measured
> figures when available.

**B5 · Strengthen the add-to-cart confirmation** (not build it — it exists). Move it out of
the occluded bar or raise its prominence, and give the button itself a transient state so
the feedback is not purely a separate line of text.

### Phase C — Findability

**C1 · Era filter.** `Product.sections` is already selected (`queries.ts` `COLUMNS`) and on
the type, so `p.sections.includes("retro-kits")` needs no new data. Add `era` to
`CatalogFilter` and `filterProducts` (`src/lib/catalog.ts:37-47`) and to
`buildCatalogFilterUrl` (`:21-35`), then render All / Current / Retro chips in
`CatalogFilters.tsx`, shown only when the list actually holds both eras. Extend
`tests/catalog.test.ts`.

**C2 · Sort control, and facets for the big lists.** No sort exists anywhere on the site.
Add newest / price ↑ / price ↓ / A–Z, applied after the existing `sortProducts` in-stock
grouping (`catalog.ts:50-52`); note `/kits` deliberately hash-shuffles (`:82-89`), which an
explicit sort must override. For `/kits` (687) and `/kits/retro-kits` (368) the 24-chip cap
at `CatalogFilters.tsx:14` correctly suppresses chips — give those lists a team `<select>`
instead, so the facet exists without the wall of pills the comment there rightly warns about.

**C3 · Header search** — navigate to `/kits?q=…`. `CatalogFilters` already seeds state from
`searchParams` (`:37-39`), so the destination works today with no extra wiring.

**C4 · Header nav wrapping** — `Header.tsx:144`. Add `whitespace-nowrap` to the nav links
(absent repo-wide) and widen the header container past `max-w-6xl` (1152px), which currently
gives ~879px to a nav needing ~1219px — so 8 of 9 items wrap even at 1920px.

**C5 · WhatsApp CTA on phones** — `Header.tsx:261` is `hidden … sm:flex`. It is not truly
absent on mobile (the drawer at `:364` and the footer both carry one), but both cost an extra
tap. Show it below 640px, icon-only if space is tight.

### Phase D — Trust

**D1 · Trust content.** A delivery line on the product page (area-based estimate + fee), an
exchange line, the phone number published as readable text (it currently exists only inside
`wa.me` URLs), a one-paragraph `/about`, and promote the Instagram link out of its 40px
monochrome footer slot into actual proof.

**D2 · Mystery-box value and pool** — `src/lib/mystery.ts`. State the saving ($3 off a
modern kit, $8 — 23% — off a retro one), name the pool, and give one exclusion and one
guarantee. Currently *"One surprise top-flight club kit"* is the entire specification of a
$26.99 purchase.

**D3 · Information & legal pages — owner's addition, not from the audit.**
The audit flagged `/about`, `/contact` and `/faq` as 404s but never asked for a privacy
policy. Adding one is still worth it, for reasons the audit did not cover:

- The site collects almost nothing — no analytics, no accounts, no checkout, no payment
  processing; the cart is `localStorage` only. A privacy page has little to disclose, and
  **saying that plainly is itself a trust signal.**
- **Meta requires a privacy policy URL** for WhatsApp Business API, Instagram Shopping and
  any Meta ad account. Given Instagram is the discovery channel, this becomes a hard
  requirement the moment that work starts.
- The footer already carries the disclaimer that actually matters for a replica seller —
  *"Replica kits — not affiliated with any club, league or federation"* (`Footer.tsx:66`).

Build these as **information pages, not legal boilerplate**: a `/faq` carrying delivery,
returns and sizing is worth more to a hesitant buyer than a privacy policy is. Write them as
honest plain-language descriptions of actual practice, not copied templates that overclaim.
These are customer-facing information, not lawyer-vetted legal cover — get them reviewed if
the business grows.

Priority within D: `/faq` (delivery + returns + sizing) > `/about` > `/contact` >
`/privacy` > `/terms`.

### Phase E — Performance and accessibility

**E1 · `prefetch={false}` on the product-card `Link`** (`JerseyCard.tsx:39`) — one line,
and `prefetch` is currently set nowhere in the repo. Keep prefetch on the ~42 category
links. Then paginate `/kits` at 48 per page, and wrap the search input in
`useDeferredValue` — the existing 250 ms debounce at `CatalogFilters.tsx:51-71` only guards
the URL write, not the filter, so all 687 cards still re-render per keystroke.

**E2 · Make the HTML cacheable.** Six files carry `export const dynamic = "force-dynamic"`
with no `revalidate` anywhere. Move to `revalidate` + the existing tag purge. **Sequence
this last and test carefully** — `CatalogFilters` calls `useSearchParams`, which opts a
route into dynamic rendering unless it sits under a Suspense boundary.

**E3 · Contrast fixes, using the codebase's own recipes.** Replace `ring-gz-navy/40`
(~2.3:1) with full-strength navy at the 13 sites listed; raise the card badge scrim
`JerseyCard.tsx:71` from `/45` to `/90`, matching the "View kit" chip eight lines below at
`:79`; and change the "In stock only" active state (`CatalogFilters.tsx:112`, white on
`#00a86b` = 3.13:1) to the navy the adjacent team chips already use at 12.67:1.

---

## Verification

- **Data:** re-run the verification SQL after each migration — `retro ∩ leagues` should go
  0 → 225, `/kits/premier-league` 67 → 124, seasonless names 153 → 15. Confirm no product
  exceeds 12 section slugs and the integrity trigger raised nothing.
- **Tests:** `npm test`. Expect `tests/whatsapp.test.ts` and `tests/cart.test.ts` to need
  updating for B3 — the "no page link" assertion is deliberate and must be inverted, not
  deleted. Add coverage for the new `era` and sort filters in `tests/catalog.test.ts`.
  Note there are currently **no component/DOM tests** (node environment, `*.test.ts` only),
  so B1/B2 need manual browser verification.
- **Browser (`npm run dev`):** at 375×812 confirm the size pills are fully visible at scroll
  0 and the bar clears the home indicator; at 1280×720 confirm no fixed bar; tab through the
  product page before picking a size and confirm the CTA is now reachable; check the focus
  ring is visible on header links and chips.
- **Message:** add two kits, open the WhatsApp link, confirm both product URLs and the
  delivery template are present and correctly encoded.
- **Build:** `npm run build` before touching E2, and again after, comparing which routes
  render static vs dynamic.

## Deliberately out of scope

- **Analytics** — excluded by owner decision 2026-08-12. Everything above rests on the
  audit's reasoning and the data checks, not on measurement.
- **30 new country sections** for the 95 retro national-team kits — a nav decision, not a
  code one. Worth a separate conversation; the audit's alternative (rename "Shop by Country"
  → "National Teams by Country") is cheaper and may be the better answer.
- **The P2 polish tier** — press states, magenta retirement, dead CSS (`gz-float`,
  `gz-twinkle`, and `--gz-reveal-order`, which is never assigned so the 55 ms stagger always
  evaluates to 0), 9/10px type, JSON-LD, 404 search. All real, all small, none blocking.
- **Product photography consistency** — a content task; real backgrounds stay per standing
  preference.

---

## Verification SQL

Kept here so the before/after numbers are reproducible.

```sql
-- Baseline, 2026-08-12
with p as (select * from products where hidden = false)
select 'total visible', count(*)::text from p
union all select 'retro-kits total', count(*)::text
  from p where 'retro-kits' = any(sections)
union all select 'retro AND any league section', count(*)::text
  from p where 'retro-kits' = any(sections) and sections && array[
    'champions-league','europa-league','premier-league','la-liga','serie-a',
    'bundesliga','ligue-1','primeira-liga','eredivisie','saudi-pro-league','mls']
union all select 'in_stock = false', count(*)::text from p where in_stock = false
union all select 'name has no season digits', count(*)::text from p where name !~ '[0-9]';
-- => 687 | 368 | 0 | 0 | 154 (153 excluding the mystery row)
```
