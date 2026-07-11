import { NextResponse } from "next/server";
import { publicConfigurationStatus } from "@/lib/config";
import { checkCatalogConnection } from "@/lib/supabase/queries";
import { adminConfigurationStatus } from "@/lib/admin/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const configuration = publicConfigurationStatus();
  const admin = adminConfigurationStatus();
  const catalog = configuration.supabaseUrl && configuration.supabaseKey
    ? await checkCatalogConnection()
    : false;
  const ok = Object.values(configuration).every(Boolean) && Object.values(admin).every(Boolean) && catalog;

  return NextResponse.json(
    { status: ok ? "ok" : "unavailable", checks: { configuration, admin, catalog } },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
