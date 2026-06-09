# GoalZone Mobile Jersey Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, on-brand jersey catalog that hands customers off to WhatsApp to order, with a no-code Sanity dashboard for the team to manage listings and per-size stock.

**Architecture:** A Next.js (App Router) storefront on Vercel renders statically-generated pages that read catalog data from Sanity. An embedded Sanity Studio at `/studio` is the team's dashboard. A Sanity webhook hits a Next.js revalidation route so edits go live in seconds. There is no custom backend, cart, or payment — "checkout" is a `wa.me` deep link with a prefilled order message. Pure business logic (sold-out derivation, search/filter/sort, WhatsApp link building) lives in tested `lib/` modules; React components stay thin.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, `next/font` (Anton + Inter), Sanity + `next-sanity` (embedded Studio + image CDN), Vitest (unit tests for pure logic), Vercel hosting.

**Reference spec:** `docs/superpowers/specs/2026-06-09-goalzone-catalog-design.md`

---

## File Structure

```
ftblkits/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # Root layout: fonts, brand bg, base metadata
│  │  ├─ page.tsx                # Catalog (home) — server component, fetches jerseys
│  │  ├─ globals.css             # Tailwind + brand tokens
│  │  ├─ jersey/[slug]/
│  │  │  ├─ page.tsx             # Jersey detail — server component, fetches one jersey
│  │  │  └─ not-found.tsx        # Unknown slug
│  │  ├─ studio/[[...tool]]/page.tsx  # Embedded Sanity Studio
│  │  └─ api/revalidate/route.ts # Sanity webhook → on-demand revalidation
│  ├─ components/
│  │  ├─ Header.tsx              # Logo header
│  │  ├─ JerseyCard.tsx          # Grid card (photo, team, kit, price, size strip)
│  │  ├─ CatalogBrowser.tsx      # Client: search box + chips + filtered grid + states
│  │  ├─ SizePicker.tsx          # Client: size chips, tracks selected size
│  │  └─ OrderButton.tsx         # Client: sticky WhatsApp button (disabled until size)
│  ├─ lib/
│  │  ├─ types.ts                # Shared TypeScript types
│  │  ├─ catalog.ts              # isSoldOut, availableSizes, sortJerseys, filterJerseys
│  │  ├─ whatsapp.ts             # buildOrderMessage, buildWhatsappLink
│  │  └─ sanity/
│  │     ├─ client.ts            # Sanity client
│  │     ├─ image.ts             # urlFor() image builder
│  │     └─ queries.ts           # GROQ queries + fetch helpers → typed objects
│  └─ sanity/
│     ├─ schema.ts               # Schema array
│     └─ schemaTypes/
│        ├─ jersey.ts
│        ├─ confederation.ts
│        └─ siteSettings.ts
├─ sanity.config.ts              # Studio config (embedded)
├─ tests/
│  ├─ catalog.test.ts
│  └─ whatsapp.test.ts
├─ public/                       # logo + favicon + og fallback
├─ .env.local                    # Sanity project id/dataset, revalidate secret
├─ vitest.config.ts
└─ README.md
```

---

## Task 1: Scaffold the Next.js app

**Files:**
- Create: project files via `create-next-app`
- Modify: `package.json`

- [ ] **Step 1: Generate the app**

Run from the project root (it already contains `.git`, `docs/`, the logo, `.gitignore`):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

When prompted that the directory is not empty, choose to proceed (it keeps existing files). If it refuses, scaffold in a temp dir and copy `src/`, `app` config files, `package.json`, `tsconfig.json`, `next.config.*`, `postcss.config.*` into the project root.

- [ ] **Step 2: Verify the dev server boots**

Run: `npm run dev`
Expected: server starts on http://localhost:3000 with the default Next page. Stop it with Ctrl-C.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app (TS, Tailwind, App Router)"
```

---

## Task 2: Install dependencies and set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install runtime + dev dependencies**

```bash
npm install next-sanity @sanity/image-url sanity @sanity/vision styled-components
npm install -D vitest @types/node
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add the test script to `package.json`**

In the `"scripts"` block add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify the test runner works with no tests**

Run: `npm test`
Expected: Vitest runs and reports "No test files found" (exit 0) or similar. This confirms config loads.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add Sanity deps and Vitest config"
```

---

## Task 3: Shared types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write the types**

```ts
export type Size = "S" | "M" | "L" | "XL" | "XXL";
export const ALL_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

export type KitType = "Home" | "Away" | "Third";

export type ConfederationId =
  | "europe"
  | "south-america"
  | "africa"
  | "asia"
  | "north-america"
  | "oceania";

export interface Confederation {
  id: ConfederationId;
  name: string;
}

export const CONFEDERATIONS: Confederation[] = [
  { id: "europe", name: "Europe" },
  { id: "south-america", name: "South America" },
  { id: "africa", name: "Africa" },
  { id: "asia", name: "Asia" },
  { id: "north-america", name: "North America" },
  { id: "oceania", name: "Oceania" },
];

export interface SizeStock {
  size: Size;
  inStock: boolean;
}

export interface JerseyImage {
  url: string;
  alt: string;
}

export interface Jersey {
  _id: string;
  team: string;
  slug: string;
  kitType: KitType;
  confederation: Confederation;
  price: number;
  photos: JerseyImage[];
  sizes: SizeStock[];
  featured: boolean;
}

export interface SiteSettings {
  whatsappNumber: string; // international digits, e.g. "9613123456"
  orderMessageTemplate: string;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared catalog types"
```

---

## Task 4: Catalog logic — sold-out, available sizes, sort, filter (TDD)

**Files:**
- Create: `src/lib/catalog.ts`
- Test: `tests/catalog.test.ts`

- [ ] **Step 1: Write the failing tests**

`tests/catalog.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  isSoldOut,
  availableSizes,
  sortJerseys,
  filterJerseys,
} from "@/lib/catalog";
import type { Jersey } from "@/lib/types";

function make(overrides: Partial<Jersey> = {}): Jersey {
  return {
    _id: overrides._id ?? "id",
    team: overrides.team ?? "Argentina",
    slug: overrides.slug ?? "argentina-home",
    kitType: overrides.kitType ?? "Home",
    confederation: overrides.confederation ?? {
      id: "south-america",
      name: "South America",
    },
    price: overrides.price ?? 28,
    photos: overrides.photos ?? [{ url: "x", alt: "x" }],
    sizes:
      overrides.sizes ??
      [
        { size: "S", inStock: true },
        { size: "M", inStock: true },
      ],
    featured: overrides.featured ?? false,
  };
}

describe("isSoldOut", () => {
  it("is false when at least one size is in stock", () => {
    expect(isSoldOut(make({ sizes: [{ size: "S", inStock: false }, { size: "M", inStock: true }] }))).toBe(false);
  });
  it("is true when every size is out of stock", () => {
    expect(isSoldOut(make({ sizes: [{ size: "S", inStock: false }, { size: "M", inStock: false }] }))).toBe(true);
  });
  it("is true when there are no sizes", () => {
    expect(isSoldOut(make({ sizes: [] }))).toBe(true);
  });
});

describe("availableSizes", () => {
  it("returns only in-stock sizes", () => {
    const j = make({ sizes: [{ size: "S", inStock: false }, { size: "L", inStock: true }] });
    expect(availableSizes(j)).toEqual(["L"]);
  });
});

describe("sortJerseys", () => {
  it("puts featured first, then alphabetical by team", () => {
    const a = make({ _id: "a", team: "Brazil", featured: false });
    const b = make({ _id: "b", team: "Spain", featured: true });
    const c = make({ _id: "c", team: "Argentina", featured: false });
    expect(sortJerseys([a, b, c]).map((j) => j._id)).toEqual(["b", "c", "a"]);
  });
  it("does not mutate the input array", () => {
    const arr = [make({ _id: "a", team: "Brazil" }), make({ _id: "b", team: "Argentina" })];
    sortJerseys(arr);
    expect(arr.map((j) => j._id)).toEqual(["a", "b"]);
  });
});

describe("filterJerseys", () => {
  const list = [
    make({ _id: "arg", team: "Argentina", confederation: { id: "south-america", name: "South America" } }),
    make({ _id: "fra", team: "France", confederation: { id: "europe", name: "Europe" } }),
  ];
  it("returns all when no query and confederation is 'all'", () => {
    expect(filterJerseys(list, { query: "", confederation: "all" }).length).toBe(2);
  });
  it("filters by case-insensitive team substring", () => {
    expect(filterJerseys(list, { query: "fra", confederation: "all" }).map((j) => j._id)).toEqual(["fra"]);
  });
  it("filters by confederation", () => {
    expect(filterJerseys(list, { query: "", confederation: "europe" }).map((j) => j._id)).toEqual(["fra"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `@/lib/catalog` cannot be resolved / functions not defined.

- [ ] **Step 3: Implement `src/lib/catalog.ts`**

```ts
import type { Jersey, Size, ConfederationId } from "@/lib/types";

export function isSoldOut(jersey: Jersey): boolean {
  return jersey.sizes.every((s) => !s.inStock);
}

export function availableSizes(jersey: Jersey): Size[] {
  return jersey.sizes.filter((s) => s.inStock).map((s) => s.size);
}

export function sortJerseys(jerseys: Jersey[]): Jersey[] {
  return [...jerseys].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.team.localeCompare(b.team);
  });
}

export interface CatalogFilter {
  query: string;
  confederation: ConfederationId | "all";
}

export function filterJerseys(jerseys: Jersey[], filter: CatalogFilter): Jersey[] {
  const q = filter.query.trim().toLowerCase();
  return jerseys.filter((j) => {
    const matchesQuery = q === "" || j.team.toLowerCase().includes(q);
    const matchesConf =
      filter.confederation === "all" || j.confederation.id === filter.confederation;
    return matchesQuery && matchesConf;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all catalog tests green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/catalog.ts tests/catalog.test.ts
git commit -m "feat: catalog logic (sold-out, sizes, sort, filter) with tests"
```

---

## Task 5: WhatsApp link builder (TDD)

**Files:**
- Create: `src/lib/whatsapp.ts`
- Test: `tests/whatsapp.test.ts`

- [ ] **Step 1: Write the failing tests**

`tests/whatsapp.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildOrderMessage, buildWhatsappLink } from "@/lib/whatsapp";

describe("buildOrderMessage", () => {
  it("substitutes all tokens", () => {
    const tpl = "Hi GoalZone! I'd like to order: {team} - {kit} - Size {size}. ${price}. {link}";
    const msg = buildOrderMessage(tpl, {
      team: "Argentina",
      kit: "Home",
      size: "L",
      price: 28,
      link: "https://goalzone.example/jersey/argentina-home",
    });
    expect(msg).toBe(
      "Hi GoalZone! I'd like to order: Argentina - Home - Size L. $28. https://goalzone.example/jersey/argentina-home",
    );
  });
});

describe("buildWhatsappLink", () => {
  it("builds a wa.me url with encoded message", () => {
    const url = buildWhatsappLink("9613123456", "Hi there & welcome");
    expect(url).toBe("https://wa.me/9613123456?text=Hi%20there%20%26%20welcome");
  });
  it("strips non-digits from the phone number", () => {
    const url = buildWhatsappLink("+961 3 123 456", "x");
    expect(url.startsWith("https://wa.me/9613123456?text=")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `@/lib/whatsapp` not found.

- [ ] **Step 3: Implement `src/lib/whatsapp.ts`**

```ts
export interface OrderVars {
  team: string;
  kit: string;
  size: string;
  price: number;
  link: string;
}

export function buildOrderMessage(template: string, vars: OrderVars): string {
  return template
    .replaceAll("{team}", vars.team)
    .replaceAll("{kit}", vars.kit)
    .replaceAll("{size}", vars.size)
    .replaceAll("{price}", String(vars.price))
    .replaceAll("{link}", vars.link);
}

export function buildWhatsappLink(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
```

Note: `encodeURIComponent` encodes spaces as `%20` and `&` as `%26`, matching the test.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/whatsapp.ts tests/whatsapp.test.ts
git commit -m "feat: WhatsApp order message + link builder with tests"
```

---

## Task 6: Sanity schemas

**Files:**
- Create: `src/sanity/schemaTypes/confederation.ts`
- Create: `src/sanity/schemaTypes/jersey.ts`
- Create: `src/sanity/schemaTypes/siteSettings.ts`
- Create: `src/sanity/schema.ts`

- [ ] **Step 1: Create `confederation.ts`**

```ts
import { defineField, defineType } from "sanity";

export const confederation = defineType({
  name: "confederation",
  title: "Confederation",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "id",
      title: "ID",
      type: "string",
      description: "europe, south-america, africa, asia, north-america, oceania",
      validation: (r) => r.required(),
    }),
  ],
});
```

- [ ] **Step 2: Create `jersey.ts`**

```ts
import { defineArrayMember, defineField, defineType } from "sanity";

export const jersey = defineType({
  name: "jersey",
  title: "Jersey",
  type: "document",
  fields: [
    defineField({ name: "team", title: "Team", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "kitType",
      title: "Kit type",
      type: "string",
      options: { list: ["Home", "Away", "Third"], layout: "radio" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: (doc) => `${doc.team}-${doc.kitType}`, maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "confederation",
      title: "Confederation",
      type: "reference",
      to: [{ type: "confederation" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "price",
      title: "Price (USD)",
      type: "number",
      validation: (r) => r.required().min(0),
    }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", title: "Alt text", type: "string" }],
        }),
      ],
      validation: (r) => r.min(1).max(4),
    }),
    defineField({
      name: "sizes",
      title: "Sizes",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            {
              name: "size",
              title: "Size",
              type: "string",
              options: { list: ["S", "M", "L", "XL", "XXL"] },
            },
            { name: "inStock", title: "In stock", type: "boolean", initialValue: true },
          ],
          preview: {
            select: { title: "size", inStock: "inStock" },
            prepare: ({ title, inStock }) => ({
              title,
              subtitle: inStock ? "In stock" : "Sold out",
            }),
          },
        }),
      ],
    }),
    defineField({ name: "featured", title: "Featured", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { title: "team", subtitle: "kitType", media: "photos.0" },
  },
});
```

- [ ] **Step 3: Create `siteSettings.ts`**

```ts
import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp number (international, digits only)",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "orderMessageTemplate",
      title: "Order message template",
      type: "text",
      description:
        "Use tokens {team} {kit} {size} {price} {link}. Example: Hi GoalZone! I'd like to order: {team} - {kit} - Size {size}. ${price}. {link}",
      validation: (r) => r.required(),
    }),
  ],
});
```

- [ ] **Step 4: Create `schema.ts`**

```ts
import type { SchemaTypeDefinition } from "sanity";
import { confederation } from "./schemaTypes/confederation";
import { jersey } from "./schemaTypes/jersey";
import { siteSettings } from "./schemaTypes/siteSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [jersey, confederation, siteSettings],
};
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/sanity/
git commit -m "feat: Sanity schemas (jersey, confederation, settings)"
```

---

## Task 7: Sanity project, env, and client

**Files:**
- Create: `.env.local` (NOT committed — already covered by `.gitignore`)
- Create: `.env.example`
- Create: `src/lib/sanity/client.ts`
- Create: `src/lib/sanity/image.ts`

- [ ] **Step 1: Create a Sanity project and dataset**

Run and follow prompts (log in, create project named "GoalZone", dataset `production`, public read):

```bash
npx sanity@latest init --bare
```

Note the printed **projectId** and **dataset**. (If running headless, the user must do this interactively via `! npx sanity@latest init --bare`.)

- [ ] **Step 2: Create `.env.example`**

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-10-01
SANITY_REVALIDATE_SECRET=choose-a-long-random-string
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 3: Create `.env.local` with the real values**

Copy `.env.example` to `.env.local` and fill `NEXT_PUBLIC_SANITY_PROJECT_ID` with the id from Step 1, and set a random `SANITY_REVALIDATE_SECRET`.

```bash
cp .env.example .env.local
```

- [ ] **Step 4: Create `src/lib/sanity/client.ts`**

```ts
import { createClient } from "next-sanity";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-10-01";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // statically built pages; revalidation handles freshness
});
```

- [ ] **Step 5: Create `src/lib/sanity/image.ts`**

```ts
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "./client";

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add .env.example src/lib/sanity/client.ts src/lib/sanity/image.ts
git commit -m "feat: Sanity client, image builder, env example"
```

---

## Task 8: GROQ queries and typed fetch helpers

**Files:**
- Create: `src/lib/sanity/queries.ts`

- [ ] **Step 1: Implement `queries.ts`**

```ts
import { groq } from "next-sanity";
import { client } from "./client";
import { urlFor } from "./image";
import type { Jersey, SiteSettings } from "@/lib/types";

const jerseyProjection = groq`{
  "_id": _id,
  team,
  "slug": slug.current,
  kitType,
  "confederation": { "id": confederation->id, "name": confederation->name },
  price,
  "photos": photos[]{ "ref": asset._ref, "alt": coalesce(alt, team + " " + kitType + " jersey") },
  "sizes": coalesce(sizes[]{ size, "inStock": coalesce(inStock, false) }, []),
  "featured": coalesce(featured, false)
}`;

// Raw shape coming back from GROQ before image URLs are resolved.
interface RawJersey {
  _id: string;
  team: string;
  slug: string;
  kitType: Jersey["kitType"];
  confederation: Jersey["confederation"];
  price: number;
  photos: { ref: string; alt: string }[];
  sizes: Jersey["sizes"];
  featured: boolean;
}

function resolve(raw: RawJersey): Jersey {
  return {
    ...raw,
    photos: (raw.photos ?? []).map((p) => ({
      url: urlFor(p.ref).width(800).quality(80).url(),
      alt: p.alt,
    })),
  };
}

export async function getAllJerseys(): Promise<Jersey[]> {
  const raw = await client.fetch<RawJersey[]>(groq`*[_type == "jersey"]${jerseyProjection}`);
  return raw.map(resolve);
}

export async function getJerseyBySlug(slug: string): Promise<Jersey | null> {
  const raw = await client.fetch<RawJersey | null>(
    groq`*[_type == "jersey" && slug.current == $slug][0]${jerseyProjection}`,
    { slug },
  );
  return raw ? resolve(raw) : null;
}

export async function getAllJerseySlugs(): Promise<string[]> {
  return client.fetch<string[]>(groq`*[_type == "jersey" && defined(slug.current)].slug.current`);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await client.fetch<SiteSettings | null>(
    groq`*[_type == "siteSettings"][0]{ whatsappNumber, orderMessageTemplate }`,
  );
  return (
    settings ?? {
      whatsappNumber: "",
      orderMessageTemplate:
        "Hi GoalZone! I'd like to order: {team} - {kit} - Size {size}. ${price}. {link}",
    }
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sanity/queries.ts
git commit -m "feat: GROQ queries and typed fetch helpers"
```

---

## Task 9: Embedded Sanity Studio

**Files:**
- Create: `sanity.config.ts`
- Create: `src/app/studio/[[...tool]]/page.tsx`

- [ ] **Step 1: Create `sanity.config.ts`**

```ts
"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schema } from "@/sanity/schema";

export default defineConfig({
  basePath: "/studio",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  schema,
  plugins: [structureTool(), visionTool()],
});
```

- [ ] **Step 2: Create `src/app/studio/[[...tool]]/page.tsx`**

```tsx
import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

- [ ] **Step 3: Verify Studio loads**

Run: `npm run dev`, then open http://localhost:3000/studio
Expected: Sanity Studio renders with Jersey / Confederation / Site Settings document types. Log in if prompted. Stop the server.

- [ ] **Step 4: Seed initial data (manual, in Studio)**

In the running Studio: create the 6 Confederation documents (name + matching id from `CONFEDERATIONS` in `types.ts`), one Site Settings doc (WhatsApp number + the template from `.env`/Task 8 default), and 2–3 sample Jerseys with photos and per-size stock for testing.

- [ ] **Step 5: Commit**

```bash
git add sanity.config.ts "src/app/studio/[[...tool]]/page.tsx"
git commit -m "feat: embedded Sanity Studio at /studio"
```

---

## Task 10: Brand foundation — fonts, tokens, root layout

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/Header.tsx`
- Add: `public/logo.png`, `public/favicon.ico` (from the existing logo JPEG)

- [ ] **Step 1: Add brand tokens to `src/app/globals.css`**

Replace the file contents with:

```css
@import "tailwindcss";

:root {
  --gz-bg: #0a0a0a;
  --gz-surface: #141414;
  --gz-red: #e11212;
  --gz-text: #ffffff;
  --gz-whatsapp: #25d366;
}

@theme inline {
  --color-gz-bg: var(--gz-bg);
  --color-gz-surface: var(--gz-surface);
  --color-gz-red: var(--gz-red);
  --color-gz-whatsapp: var(--gz-whatsapp);
}

html, body {
  background: var(--gz-bg);
  color: var(--gz-text);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Add the logo and favicon to `public/`**

Copy the existing brand image and create a favicon. Run:

```bash
cp "WhatsApp Image 2026-06-09 at 6.31.46 PM.jpeg" public/logo.jpeg
```

Then in Studio/locally, export a square PNG `public/logo.png` and a `public/favicon.ico` from the logo (manual). If tooling is unavailable, place `app/icon.png` (Next auto-uses it) by copying the logo: `cp public/logo.jpeg src/app/icon.jpeg`.

- [ ] **Step 3: Create `src/components/Header.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-center border-b border-white/10 bg-gz-bg/95 px-4 py-3 backdrop-blur">
      <Link href="/" aria-label="GoalZone home" className="flex items-center">
        <Image src="/logo.png" alt="The Goal Zone" width={120} height={48} priority className="h-10 w-auto" />
      </Link>
    </header>
  );
}
```

- [ ] **Step 4: Rewrite `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "The Goal Zone — Football Kits", template: "%s | The Goal Zone" },
  description: "Replica national-team jerseys in Beirut. Browse, pick your size, order on WhatsApp.",
  openGraph: {
    title: "The Goal Zone — Football Kits",
    description: "Replica national-team jerseys in Beirut. Order on WhatsApp.",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${anton.variable} ${inter.variable} font-[family-name:var(--font-body)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify build/dev renders the dark theme + logo**

Run: `npm run dev` and open http://localhost:3000 (page may still be default — confirm dark bg + no errors). Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/Header.tsx public/ src/app/icon.jpeg
git commit -m "feat: brand foundation (fonts, tokens, header, layout, og)"
```

---

## Task 11: JerseyCard component

**Files:**
- Create: `src/components/JerseyCard.tsx`

- [ ] **Step 1: Implement `JerseyCard.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Jersey } from "@/lib/types";
import { isSoldOut } from "@/lib/catalog";

export function JerseyCard({ jersey }: { jersey: Jersey }) {
  const soldOut = isSoldOut(jersey);
  const photo = jersey.photos[0];

  return (
    <Link
      href={`/jersey/${jersey.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-gz-surface transition-transform duration-200 active:scale-[0.98]"
    >
      <div className="relative aspect-square">
        {photo && (
          <Image
            src={photo.url}
            alt={photo.alt}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="-rotate-6 border-2 border-gz-red px-2 py-1 font-[family-name:var(--font-display)] text-sm uppercase text-gz-red">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-[family-name:var(--font-display)] text-base uppercase leading-tight">{jersey.team}</h3>
        <p className="text-xs font-extrabold uppercase tracking-wide text-gz-red">{jersey.kitType}</p>
        <p className="mt-1 text-sm font-bold">${jersey.price}</p>
        <ul className="mt-2 flex gap-1" aria-label="Size availability">
          {jersey.sizes.map((s) => (
            <li
              key={s.size}
              className={`flex h-5 w-6 items-center justify-center rounded text-[10px] font-bold ${
                s.inStock ? "bg-white/10 text-white" : "bg-white/5 text-white/40 line-through"
              }`}
            >
              {s.size}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/JerseyCard.tsx
git commit -m "feat: JerseyCard grid component"
```

---

## Task 12: CatalogBrowser (client) — search, chips, grid, states

**Files:**
- Create: `src/components/CatalogBrowser.tsx`

- [ ] **Step 1: Implement `CatalogBrowser.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Jersey, ConfederationId } from "@/lib/types";
import { CONFEDERATIONS } from "@/lib/types";
import { filterJerseys, sortJerseys } from "@/lib/catalog";
import { JerseyCard } from "./JerseyCard";

export function CatalogBrowser({ jerseys }: { jerseys: Jersey[] }) {
  const [query, setQuery] = useState("");
  const [confederation, setConfederation] = useState<ConfederationId | "all">("all");

  const sorted = useMemo(() => sortJerseys(jerseys), [jerseys]);
  const visible = useMemo(
    () => filterJerseys(sorted, { query, confederation }),
    [sorted, query, confederation],
  );

  const chips: { id: ConfederationId | "all"; name: string }[] = [
    { id: "all", name: "All" },
    ...CONFEDERATIONS.map((c) => ({ id: c.id, name: c.name })),
  ];

  return (
    <div className="px-3 pb-10">
      <div className="py-3">
        <label htmlFor="search" className="sr-only">Search your team</label>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your team…"
          className="w-full rounded-xl border border-white/10 bg-gz-surface px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-gz-red focus:outline-none focus:ring-2 focus:ring-gz-red"
        />
      </div>

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-3" role="group" aria-label="Filter by confederation">
        {chips.map((c) => {
          const active = confederation === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => setConfederation(c.id)}
              className={`min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors duration-200 ${
                active ? "bg-gz-red text-white" : "bg-gz-surface text-white/70"
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-white/60">No jerseys match — try another team.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((j) => (
            <JerseyCard key={j._id} jersey={j} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CatalogBrowser.tsx
git commit -m "feat: CatalogBrowser with search, chips, grid, empty state"
```

---

## Task 13: Catalog home page

**Files:**
- Modify/replace: `src/app/page.tsx`

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
import { Header } from "@/components/Header";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { getAllJerseys } from "@/lib/sanity/queries";

export const revalidate = 60; // fallback; webhook revalidation makes it near-instant

export default async function HomePage() {
  const jerseys = await getAllJerseys();
  return (
    <main>
      <Header />
      <CatalogBrowser jerseys={jerseys} />
    </main>
  );
}
```

- [ ] **Step 2: Verify the catalog renders with seeded data**

Run: `npm run dev`, open http://localhost:3000
Expected: header logo, search box, confederation chips, and a 2-column grid of the seeded jerseys. Typing in search filters; chips filter by confederation; sold-out jerseys show the overlay. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: catalog home page wired to Sanity"
```

---

## Task 14: SizePicker + OrderButton (client components)

**Files:**
- Create: `src/components/SizePicker.tsx`
- Create: `src/components/OrderButton.tsx`

- [ ] **Step 1: Implement `OrderButton.tsx`**

```tsx
"use client";

import type { Jersey, SiteSettings, Size } from "@/lib/types";
import { buildOrderMessage, buildWhatsappLink } from "@/lib/whatsapp";

export function OrderButton({
  jersey,
  settings,
  selectedSize,
  pageUrl,
}: {
  jersey: Jersey;
  settings: SiteSettings;
  selectedSize: Size | null;
  pageUrl: string;
}) {
  const disabled = selectedSize === null;

  const href = disabled
    ? undefined
    : buildWhatsappLink(
        settings.whatsappNumber,
        buildOrderMessage(settings.orderMessageTemplate, {
          team: jersey.team,
          kit: jersey.kitType,
          size: selectedSize,
          price: jersey.price,
          link: pageUrl,
        }),
      );

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-gz-bg/95 p-4 backdrop-blur">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={disabled}
        onClick={(e) => disabled && e.preventDefault()}
        className={`flex min-h-12 w-full items-center justify-center rounded-full text-base font-extrabold transition-colors duration-200 ${
          disabled
            ? "cursor-not-allowed bg-white/10 text-white/40"
            : "bg-gz-whatsapp text-black"
        }`}
      >
        {disabled ? "Select a size" : "Order on WhatsApp"}
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Implement `SizePicker.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Jersey, SiteSettings, Size } from "@/lib/types";
import { OrderButton } from "./OrderButton";

export function SizePicker({
  jersey,
  settings,
  pageUrl,
}: {
  jersey: Jersey;
  settings: SiteSettings;
  pageUrl: string;
}) {
  const [selected, setSelected] = useState<Size | null>(null);

  return (
    <>
      <div className="mt-6">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-white/60">Select size</h2>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Select size">
          {jersey.sizes.map((s) => {
            const isSelected = selected === s.size;
            return (
              <button
                key={s.size}
                type="button"
                disabled={!s.inStock}
                aria-pressed={isSelected}
                onClick={() => setSelected(s.size)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold transition-colors duration-200 ${
                  !s.inStock
                    ? "cursor-not-allowed bg-white/5 text-white/30 line-through"
                    : isSelected
                      ? "bg-gz-red text-white"
                      : "bg-gz-surface text-white"
                }`}
              >
                {s.size}
              </button>
            );
          })}
        </div>
      </div>
      <OrderButton jersey={jersey} settings={settings} selectedSize={selected} pageUrl={pageUrl} />
    </>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SizePicker.tsx src/components/OrderButton.tsx
git commit -m "feat: size picker and sticky WhatsApp order button"
```

---

## Task 15: Jersey detail page + not-found

**Files:**
- Create: `src/app/jersey/[slug]/page.tsx`
- Create: `src/app/jersey/[slug]/not-found.tsx`

- [ ] **Step 1: Implement `not-found.tsx`**

```tsx
import Link from "next/link";
import { Header } from "@/components/Header";

export default function JerseyNotFound() {
  return (
    <main>
      <Header />
      <div className="px-4 py-20 text-center">
        <p className="text-white/70">This jersey isn’t available.</p>
        <Link href="/" className="mt-4 inline-block font-bold text-gz-red">
          Back to catalog
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Implement `page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SizePicker } from "@/components/SizePicker";
import { getAllJerseySlugs, getJerseyBySlug, getSiteSettings } from "@/lib/sanity/queries";

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  const slugs = await getAllJerseySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const jersey = await getJerseyBySlug(slug);
  if (!jersey) return { title: "Jersey not found" };
  const title = `${jersey.team} ${jersey.kitType} — $${jersey.price}`;
  return {
    title,
    openGraph: { title, images: jersey.photos[0] ? [jersey.photos[0].url] : ["/logo.png"] },
  };
}

export default async function JerseyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [jersey, settings] = await Promise.all([getJerseyBySlug(slug), getSiteSettings()]);
  if (!jersey) notFound();

  const pageUrl = `${siteUrl}/jersey/${jersey.slug}`;

  return (
    <main className="pb-28">
      <Header />
      <div className="px-4">
        <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl bg-gz-surface">
          {jersey.photos[0] && (
            <Image
              src={jersey.photos[0].url}
              alt={jersey.photos[0].alt}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
              priority
            />
          )}
        </div>

        {jersey.photos.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {jersey.photos.slice(1).map((p, i) => (
              <div key={i} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gz-surface">
                <Image src={p.url} alt={p.alt} fill sizes="80px" className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-3xl uppercase leading-none">
          {jersey.team}
        </h1>
        <p className="mt-1 font-extrabold uppercase tracking-wide text-gz-red">{jersey.kitType}</p>
        <p className="mt-2 text-2xl font-bold">${jersey.price}</p>

        <SizePicker jersey={jersey} settings={settings} pageUrl={pageUrl} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify detail page + WhatsApp handoff**

Run: `npm run dev`, click a jersey from the home grid.
Expected: photo(s), team/kit/price, size chips (sold-out struck through and unclickable). Button reads "Select a size" until a size is tapped, then "Order on WhatsApp"; tapping opens `wa.me` with the prefilled message containing team, kit, size, price, and the page URL. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add "src/app/jersey"
git commit -m "feat: jersey detail page with metadata and WhatsApp handoff"
```

---

## Task 16: On-demand revalidation webhook

**Files:**
- Create: `src/app/api/revalidate/route.ts`

- [ ] **Step 1: Implement the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false, message: "Invalid secret" }, { status: 401 });
  }

  let slug: string | undefined;
  try {
    const body = await req.json();
    slug = body?.slug?.current ?? body?.slug;
  } catch {
    // no body / not JSON — fall through and revalidate the catalog only
  }

  revalidatePath("/");
  if (slug) revalidatePath(`/jersey/${slug}`);

  return NextResponse.json({ revalidated: true, slug: slug ?? null });
}
```

- [ ] **Step 2: Verify the secret guard locally**

Run: `npm run dev`, then in another terminal:

```bash
curl -s -X POST "http://localhost:3000/api/revalidate?secret=wrong" -o - -w "\n%{http_code}\n"
```

Expected: `401` with `{"revalidated":false,...}`. Then test the happy path with the real secret from `.env.local`:

```bash
curl -s -X POST "http://localhost:3000/api/revalidate?secret=YOUR_SECRET" -H "Content-Type: application/json" -d '{"slug":{"current":"argentina-home"}}' -o - -w "\n%{http_code}\n"
```

Expected: `200` with `{"revalidated":true,"slug":"argentina-home"}`. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/revalidate/route.ts
git commit -m "feat: Sanity webhook revalidation route"
```

---

## Task 17: Production build, README, and deploy notes

**Files:**
- Create: `README.md`

- [ ] **Step 1: Run the full check**

```bash
npm test && npx tsc --noEmit && npm run build
```

Expected: tests pass, no type errors, production build succeeds (catalog + jersey routes prerendered, `/studio` and `/api/revalidate` present). Fix any failures before continuing.

- [ ] **Step 2: Write `README.md`**

````markdown
# GoalZone — Football Kits Catalog

Mobile-first jersey catalog. Customers browse, pick a size, and order on WhatsApp.
Team manages listings/stock in Sanity Studio at `/studio` — no code required.

## Stack
Next.js (App Router, TS) · Tailwind · Sanity (embedded Studio) · Vercel

## Local development
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in Sanity project id + a revalidate secret.
3. `npm run dev` → site at http://localhost:3000, dashboard at http://localhost:3000/studio

## Tests
`npm test` (Vitest — covers catalog logic and WhatsApp link building)

## Deploy (Vercel)
1. Push to GitHub, import the repo in Vercel.
2. Add env vars from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to the production URL).
3. After first deploy, in Sanity (manage.sanity.io) add a **webhook**:
   - URL: `https://<your-domain>/api/revalidate?secret=<SANITY_REVALIDATE_SECRET>`
   - Trigger: on create/update/delete of `jersey` documents
   - Projection: `{ "slug": slug }`
4. Add the production domain to Sanity **CORS origins** (API settings).

## Managing the catalog (for the team)
- Go to `/studio`, log in.
- **Add a jersey:** New → Jersey → fill team, kit type, confederation, price, photos, sizes → Publish.
- **Mark a size sold out:** open the jersey → toggle that size's *In stock* off → Publish. (All sizes off = the whole card shows "Sold Out".)
- **Change WhatsApp number/message:** Site Settings document.
````

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: project README with setup, deploy, and team guide"
```

- [ ] **Step 4: Deploy (interactive — done by the user)**

Push the branch and deploy via Vercel per the README. Configure the Sanity webhook and CORS origin. Verify the live URL: catalog loads, a jersey detail page opens WhatsApp correctly, and toggling a size in Studio updates the live site within seconds.

---

## Self-Review Notes

- **Spec coverage:** architecture (Tasks 1,7,9,16), data model (Tasks 3,6,8), per-size stock + derived sold-out (Tasks 4,6,11,14), separate home/away listings (schema kit type + slug), filter/search browsing (Task 12), WhatsApp message with jersey+size+link (Tasks 5,14,15), visual identity black/red/white + Anton/Inter (Task 10), social/SEO OG (Tasks 10,15), image performance via next/image (Tasks 11,15), accessibility & reduced-motion (Tasks 10,12,14), no-code admin (Task 9). USD pricing throughout. No-printing/no-cart respected (absent by design).
- **Placeholder scan:** every code step contains complete code; the only manual steps are inherently interactive (Sanity init/login, data seeding, image export, Vercel deploy) and are explicitly marked as such.
- **Type consistency:** `Jersey`, `SiteSettings`, `Size`, `ConfederationId`, `CONFEDERATIONS` defined once in `types.ts` and reused; function names (`isSoldOut`, `availableSizes`, `sortJerseys`, `filterJerseys`, `buildOrderMessage`, `buildWhatsappLink`, query helpers) match across tasks.
