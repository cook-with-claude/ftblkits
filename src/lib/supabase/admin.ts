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
