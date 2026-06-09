# GoalZone — Mobile Jersey Catalog — Design Spec

**Date:** 2026-06-09
**Status:** Approved (design phase)

## 1. Purpose

GoalZone ("THE GOAL ZONE — Football Kits") is a Beirut-based football kit
startup selling replica national-team jerseys during the 2026 FIFA World Cup
window. The website is a **mobile-first product catalog** reached from the
GoalZone Instagram and TikTok bio links. Its single job: let people browse the
full jersey collection, pick a size, and get handed off to WhatsApp to place an
order. Payment (cash on delivery or Whish Money) and order confirmation happen
entirely in WhatsApp chat — the site does not handle them.

The three (non-technical) founders must be able to add/remove jerseys, upload
photos, set prices/sizes, and flip stock on/off **without touching code**.

## 2. Success Criteria

- A customer on a phone can go bio-link → find their team → pick a size →
  open WhatsApp with a correct prefilled order, in seconds.
- The team can publish a new jersey or mark a size sold out from a phone, with
  the change live on the site within seconds and no developer involved.
- The site feels native to Instagram/TikTok: fast on Beirut mobile data, bold,
  visual, on-brand (black / red / white, athletic type).
- Shared jersey links unfurl on social with the jersey photo + price.

## 3. Architecture

Two connected pieces, no custom backend server:

```
  Instagram/TikTok bio link
            │
            ▼
   ┌──────────────────┐         ┌─────────────────┐
   │  GoalZone site   │◀────────│  Sanity (data + │
   │  (Next.js/Vercel)│  fetch  │   images + CDN) │
   └────────┬─────────┘         └────────▲────────┘
            │                            │ edits
            ▼                   ┌─────────┴─────────┐
     wa.me deep link           │  Sanity Studio    │
     (prefilled order)         │  (team dashboard) │
            │                   └───────────────────┘
            ▼
        WhatsApp
```

- **Storefront:** Next.js (App Router) hosted on Vercel. Pages are statically
  generated and read catalog data from Sanity at build time.
- **Freshness:** A Sanity webhook triggers Next.js **on-demand revalidation**,
  so stock/listing edits appear on the live site within seconds without a
  manual rebuild or code change.
- **Admin:** Sanity Studio — a free hosted dashboard the founders log into from
  phone or laptop to manage the catalog.
- **No** cart, accounts, login, online payment, backend API, or database to
  maintain. Both Vercel and Sanity run on free tiers at this scale.
- **Resilience:** If Sanity is briefly unreachable, the last statically built
  catalog continues to serve.

### Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Fonts:** `next/font` — Anton (display) + Inter (body)
- **CMS/data/images:** Sanity (+ Sanity Studio, + Sanity Image CDN)
- **Hosting:** Vercel

## 4. Data Model

### Jersey (one per listing)

| Field | Type | Notes |
|---|---|---|
| `team` | string | National team name, e.g. "Argentina" |
| `slug` | slug | Derived from team + kit; used in `/jersey/[slug]` URL |
| `kitType` | enum: Home / Away / Third | Each kit is its own listing |
| `confederation` | reference to fixed list | Drives filter chips |
| `price` | number | USD; rendered as `$28` |
| `photos` | array of images (1–4) | First = grid thumbnail; all show on detail page; alt text per image |
| `sizes` | array of `{ size: S/M/L/XL/XXL, inStock: boolean }` | Per-size availability |
| `featured` | boolean | Featured jerseys sort to top of grid |

- **Whole-jersey sold out** is *derived*: if every size has `inStock: false`,
  the card shows the angled "Sold Out" overlay. No separate field to maintain.

### Confederation (fixed list, not free-typed)

Europe, South America, Africa, Asia, North America, Oceania.

### Site Settings (single document)

| Field | Notes |
|---|---|
| `whatsappNumber` | International format; used to build `wa.me` link |
| `orderMessageTemplate` | Base prefilled message text |

Editable by the team without code.

## 5. Pages & Customer Flow

Mobile-first throughout; responsive up to desktop.

### Catalog (home) — `/`
- Header with GoalZone logo.
- Search box: filters the grid live by team name as the user types.
- Confederation filter chips: All / Europe / South America / Africa / Asia /
  North America / Oceania.
- 2-column jersey grid: photo, team name (Anton), kit type (red), price,
  per-size availability strip (sold-out sizes struck through).
- Sold-out jerseys remain visible with the angled "Sold Out" overlay.
- Sort: featured first.
- States: loading skeleton; empty/no-results ("No jerseys match — try another
  team").

### Jersey detail — `/jersey/[slug]`
- Swipeable photo(s), team name, kit type, price.
- Size selector: tappable S/M/L/XL/XXL chips; sold-out sizes struck through and
  unselectable.
- Sticky bottom **Order on WhatsApp** button (WhatsApp green `#25D366`),
  disabled until a size is chosen.
- On tap, opens `wa.me` with a prefilled message, e.g.:
  > Hi GoalZone! I'd like to order: **Argentina — Home — Size L**. $28.
  > (link to this jersey page)
- Each jersey has its own URL — the shareable link used in the WhatsApp message
  and in social stories.

### Journey
IG/TikTok bio → catalog → tap jersey card (opens detail page, not a popup, so
the link is shareable) → pick size → Order on WhatsApp → team confirms and
arranges cash-on-delivery / Whish Money in chat.

## 6. Visual Identity

- **Direction:** "Immersive Matchday" — dark, edge-to-edge, photo-first,
  Instagram/TikTok-native (selected over a more structured "Scoreboard Store"
  alternative).
- **Palette:** background `#0A0A0A`, accent race-red `#E11212`, white text.
  WhatsApp green `#25D366` reserved exclusively for the order button.
- **Type:** Anton (bold condensed) for team names/headings; Inter for body/UI.
  Loaded via `next/font` (no FOUT).
- **Motion:** subtle, 200–300ms tap feedback, smooth chip/size transitions,
  image fade-in. Honors `prefers-reduced-motion`.
- **Logo:** in header; black background makes it pop.

## 7. Cross-Cutting Essentials (in scope, not optional polish)

- **Social/SEO:** Open Graph tags + image on homepage and every jersey page so
  shared links unfurl with jersey photo + price. Title/description/favicon from
  logo.
- **Performance:** Next.js `<Image>` serving WebP/AVIF, correct `sizes`, lazy
  loading, reserved space (no layout shift). Optimized for Beirut mobile data.
- **Accessibility:** ≥44px tap targets, visible focus states, alt text on all
  jersey photos, labelled controls, AA contrast. Sold-out conveyed by text +
  style, never color alone.

## 8. Out of Scope (YAGNI)

Cart, accounts/login, online payment, order tracking, reviews, multi-language,
player name/number printing (customers ask on WhatsApp), analytics dashboards.
Deferrable to later if the business grows.

## 9. Design Intelligence Notes

Grounded in the `ui-ux-pro-max` skill: adopted its high-energy / photo-first /
scroll-snap pattern direction and its UX + pre-delivery checklist (44px targets,
visible focus, AA contrast, `prefers-reduced-motion`, WebP/AVIF imagery). Its
generated color (gold) and font pairing were intentionally **overridden** in
favor of the established GoalZone brand (black/red/white, condensed athletic
type).
