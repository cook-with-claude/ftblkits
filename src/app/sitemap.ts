import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getAllProducts, getSections } from "@/lib/supabase/queries";

// Metadata route handlers are cached by default. The URLs are admin-managed, so
// regenerate this route on request just like the storefront pages.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, sectionsResult] = await Promise.all([getAllProducts(), getSections()]);

  const products =
    catalog.status === "ok" ? catalog.products.filter((product) => product.inStock) : [];

  // getSections only returns visible sections (enforced by RLS), so the empty
  // league and season shells never enter the sitemap as thin content.
  const sectionUrls: MetadataRoute.Sitemap = sectionsResult.sections.map((section) => ({
    url: `${SITE_URL}/kits/${section.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const jerseyUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/jersey/${product.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/kits`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...sectionUrls,
    ...jerseyUrls,
  ];
}
