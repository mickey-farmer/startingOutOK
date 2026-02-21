import { NextResponse } from "next/server";
import { getCastingCallsList } from "@/lib/data-source";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCastingCallsList();
    const source = isSupabaseConfigured() ? "supabase" : "json";
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "X-Data-Source": source,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load casting calls";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
