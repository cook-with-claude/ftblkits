// WhatsApp ordering config. The number is set once via env (rarely changes);
// the catalog itself lives in Supabase.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

const DEFAULT_SITE_URL = "https://the-goal-zone-kits.netlify.app";

export function normalizeSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): string {
  try {
    const url = new URL(value || DEFAULT_SITE_URL);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Invalid protocol");
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl();

export function publicConfigurationStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let validSupabaseUrl = false;
  let validSiteUrl = false;
  try {
    validSupabaseUrl = Boolean(supabaseUrl && new URL(supabaseUrl).protocol === "https:");
  } catch {
    validSupabaseUrl = false;
  }
  try {
    const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    validSiteUrl = siteUrl.protocol === "http:" || siteUrl.protocol === "https:";
  } catch {
    validSiteUrl = false;
  }

  return {
    supabaseUrl: validSupabaseUrl,
    supabaseKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    whatsapp: /^\d{7,15}$/.test((process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "")),
    siteUrl: validSiteUrl,
  };
}

// Tokens: {name} {size} {quantity} {notes}
// {notes} is a pre-formatted extra line (or "") so the template stays a single string.
export const ORDER_MESSAGE_TEMPLATE =
  "Hi GoalZone! I'd like to order:\n{quantity}x {name} — Size {size}.{notes}";
