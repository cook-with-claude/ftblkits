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
