# GoalZone Launch Readiness

## Current decision

**Conditional GO.** The hardened application passes its local quality gates, but the
new Supabase migration and updated Netlify build must be deployed before the current
production site receives final approval. Do not treat a successful build alone as a
production launch.

The dependency gate has no moderate, high, or critical findings. npm currently reports
one low-severity esbuild advisory limited to the Windows development server; `npm audit
fix --dry-run` proposes no compatible update. It is not shipped as a production runtime
dependency and should be revisited when Vite/Vitest publish a compatible patched range.

## Required production configuration

Set these in Netlify; never commit their values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_WHATSAPP_NUMBER` in international digits
- `NEXT_PUBLIC_SITE_URL` (`https://the-goal-zone-kits.netlify.app` until a custom domain is chosen)
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD` (unique, preferably 16+ characters)
- `ADMIN_SESSION_SECRET` (at least 32 random bytes)

Rotating either admin secret invalidates existing manager sessions. After changing a
public environment variable, trigger a fresh Netlify deployment.

## Supabase gate

Apply migrations in timestamp order, including
`20260711010000_launch_hardening.sql`. Before and after applying it:

1. Confirm every visible product has at least one size and a `kits` bucket image.
2. Confirm RLS is enabled on `public.products`.
3. Using the publishable key, verify `select` returns only `hidden = false` rows.
4. Verify anonymous insert, update, and delete requests fail.
5. Confirm the `kits` bucket is public-read and limited to JPEG, PNG, WebP, or AVIF up to 8 MB.
6. Keep a database backup or point-in-time recovery checkpoint before migration.

The hardening migration does not delete products or stored images. It replaces broad
public read policies with a visible-products-only policy and adds constraints for new
writes. It also normalizes mystery-kit marketing copy to replica wording.

## Deployment and smoke test

Run locally:

```text
npm ci
npm run lint
npm test
npm run build
npm audit --omit=dev
```

After Netlify deploys:

1. Check `/api/health` returns HTTP 200 with every check true.
2. Check `/robots.txt`, `/sitemap.xml`, the home canonical URL, CSP, frame protection,
   and `X-Content-Type-Options`.
3. Test desktop and mobile navigation, country/search filters, saved-kit hearts, a
   regular order, a mystery order with notes, sold-out behavior, and a malformed kit URL.
4. Confirm WhatsApp opens the intended number with product, size, and quantity.
5. Confirm `/api/admin/products` returns 401 without a session and cross-origin admin
   mutations return 403.
6. With the owner's approval, log into `/admin`, create a **hidden** test kit, upload and
   replace a photo, save a decimal price, confirm it remains absent publicly, then delete
   it and confirm the managed images are removed.
7. Check Netlify function logs and the scheduled Supabase keep-alive workflow.

## Monitoring and rollback

- Monitor `/api/health`, Netlify function errors, Supabase availability, storage usage,
  and failed scheduled keep-alive runs.
- If storefront errors rise after deployment, roll Netlify back to the previous deploy.
- Database rollback should restore the pre-migration policy/backup; do not disable RLS
  or expose service-role credentials as a workaround.
- Change `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` immediately if either may have leaked.

## Owner sign-off

Before advertising the store, the owner must confirm:

- All inventory is accurately described as replica merchandise.
- Prices, available sizes, stock, WhatsApp number, Instagram, and TikTok are current.
- Delivery fees/timing and exchange/return rules are communicated on WhatsApp before
  order confirmation; no unverified policy promises are published on the site.
- Product photos and marketing copy may legally be used.
