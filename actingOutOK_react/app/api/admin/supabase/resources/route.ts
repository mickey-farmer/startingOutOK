import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

type ResourcesData = Record<string, Array<Record<string, unknown>>>;

function toResourceRow(section: string, entry: Record<string, unknown>) {
  return {
    id: entry.id as string,
    section,
    title: entry.title as string,
    type: (entry.type as string) ?? null,
    subcategory: (entry.subcategory as string) ?? null,
    description: (entry.description as string) ?? null,
    location: (entry.location as string) ?? null,
    link: (entry.link as string) ?? null,
    imdb_link: (entry.imdbLink as string) ?? null,
    vendor: (entry.vendor as boolean) ?? false,
    pills: entry.pills ?? [],
    schedule: (entry.schedule as string) ?? null,
  };
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const payload = await verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let body: { resources: ResourcesData };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { resources } = body;
  if (!resources || typeof resources !== "object") {
    return NextResponse.json({ error: "resources object required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { error: delError } = await supabase.from("resources").delete().neq("id", "");
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  const rows: ReturnType<typeof toResourceRow>[] = [];
  for (const [section, entries] of Object.entries(resources)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      rows.push(toResourceRow(section, entry as Record<string, unknown>));
    }
  }
  if (rows.length > 0) {
    const { error: insError } = await supabase.from("resources").insert(rows);
    if (insError) {
      return NextResponse.json({ error: insError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
