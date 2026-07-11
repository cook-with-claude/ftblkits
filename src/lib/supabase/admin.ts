import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client using the SERVICE ROLE key. This bypasses RLS, so it must
// NEVER be imported into client components — only inside /api/admin route handlers.
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin env vars (URL / SUPABASE_SERVICE_ROLE_KEY) are not set");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export const KITS_BUCKET = "kits";

export function kitsStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
    const project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const prefix = `/storage/v1/object/public/${KITS_BUCKET}/`;
    if (url.protocol !== "https:" || url.origin !== project.origin || !url.pathname.startsWith(prefix)) {
      return null;
    }
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    return path && !path.includes("..") ? path : null;
  } catch {
    return null;
  }
}

type AdminClient = ReturnType<typeof getAdminClient>;

export async function removeImageIfUnreferenced(
  supabase: AdminClient,
  publicUrl: string | null | undefined,
): Promise<void> {
  const path = kitsStoragePath(publicUrl);
  if (!path || !publicUrl) return;

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("image_url", publicUrl);
  if (countError) throw countError;
  if ((count ?? 0) > 0) return;

  const { error: removeError } = await supabase.storage.from(KITS_BUCKET).remove([path]);
  if (removeError) throw removeError;
}
