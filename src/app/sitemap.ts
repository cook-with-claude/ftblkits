import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://the-goal-zone-kits.netlify.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("in_stock", true);

  const jerseyUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE_URL}/jersey/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...jerseyUrls,
  ];
}
