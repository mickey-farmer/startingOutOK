import { NextRequest, NextResponse } from "next/server";
import { getCastingCallBySlug } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }
  try {
    const data = await getCastingCallBySlug(slug);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load casting call";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
