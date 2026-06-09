# GoalZone — Football Kits Catalog

Mobile-first jersey catalog. Customers browse, pick a size, and order on WhatsApp.
The team manages listings and stock in Sanity Studio at `/studio` — no code required.

## Stack
Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Sanity (embedded Studio) · Vercel

## Local development
1. `npm install`
2. Create a Sanity project (one time): `npx sanity@latest init --bare` — note the **projectId**.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` — from step 2
   - `NEXT_PUBLIC_SANITY_DATASET` — `production`
   - `SANITY_REVALIDATE_SECRET` — any long random string
   - `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` for local
4. `npm run dev` → site at http://localhost:3000, dashboard at http://localhost:3000/studio

## Tests
`npm test` — Vitest unit tests covering catalog logic (sold-out, sort, filter) and WhatsApp link building.

## Deploy (Vercel)
1. Push to GitHub, import the repo in Vercel.
2. Add the env vars from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to the production URL).
3. After the first deploy, in Sanity (manage.sanity.io) add a **webhook**:
   - URL: `https://<your-domain>/api/revalidate?secret=<SANITY_REVALIDATE_SECRET>`
   - Trigger on create/update/delete of `jersey` documents
   - Projection: `{ "slug": slug }`
4. Add the production domain to Sanity **CORS origins** (API settings).

## Managing the catalog (for the team)
- Go to `/studio` and log in.
- **Add a jersey:** New → Jersey → fill team, kit type, confederation, price, photos, sizes → Publish.
- **Mark a size sold out:** open the jersey → toggle that size's *In stock* off → Publish. (All sizes off = the whole card shows "Sold Out".)
- **Change WhatsApp number / order message:** edit the Site Settings document.
- **Seed once:** create the 6 Confederation docs (Europe, South America, Africa, Asia, North America, Oceania) with matching ids (europe, south-america, africa, asia, north-america, oceania), and one Site Settings doc.
