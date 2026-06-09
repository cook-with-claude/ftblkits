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
