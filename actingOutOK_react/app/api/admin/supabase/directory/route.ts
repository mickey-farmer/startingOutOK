import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

type DirectoryData = Record<string, Array<Record<string, unknown>>>;

function toCastRow(entry: Record<string, unknown>) {
  return {
    id: entry.id as string,
    name: entry.name as string,
    pronouns: (entry.pronouns as string) ?? null,
    description: (entry.description as string) ?? null,
    location: (entry.location as string) ?? null,
    link: (entry.link as string) ?? null,
    contact_link: (entry.contactLink as string) ?? null,
    contact_label: (entry.contactLabel as string) ?? null,
    email: (entry.email as string) ?? null,
    instagram: (entry.instagram as string) ?? null,
    other_links: entry.otherLinks ?? [],
    tmdb_person_id: (entry.tmdbPersonId as number) ?? null,
    photo_url: (entry.photoUrl as string) ?? null,
    credits: entry.credits ?? {},
  };
}

function toCrewRow(section: string, entry: Record<string, unknown>) {
  return {
    id: entry.id as string,
    section,
    name: entry.name as string,
    pronouns: (entry.pronouns as string) ?? null,
    description: (entry.description as string) ?? null,
    location: (entry.location as string) ?? null,
    link: (entry.link as string) ?? null,
    contact_link: (entry.contactLink as string) ?? null,
    contact_label: (entry.contactLabel as string) ?? null,
    pills: entry.pills ?? [],
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

  let body: { directory: DirectoryData };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { directory } = body;
  if (!directory || typeof directory !== "object") {
    return NextResponse.json({ error: "directory object required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const talent = directory["Talent"];
  if (Array.isArray(talent)) {
    const { error: delError } = await supabase.from("cast").delete().neq("id", "");
    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }
    if (talent.length > 0) {
      const rows = talent.map((e) => toCastRow(e as Record<string, unknown>));
      const { error: insError } = await supabase.from("cast").insert(rows);
      if (insError) {
        return NextResponse.json({ error: insError.message }, { status: 500 });
      }
    }
  }

  const crewEntries: { section: string; entry: Record<string, unknown> }[] = [];
  for (const [section, entries] of Object.entries(directory)) {
    if (section === "Talent" || !Array.isArray(entries)) continue;
    for (const entry of entries) {
      crewEntries.push({ section, entry: entry as Record<string, unknown> });
    }
  }
  const { error: delCrewError } = await supabase.from("crew").delete().neq("id", "");
  if (delCrewError) {
    return NextResponse.json({ error: delCrewError.message }, { status: 500 });
  }
  if (crewEntries.length > 0) {
    const rows = crewEntries.map(({ section, entry }) => toCrewRow(section, entry));
    const { error: insCrewError } = await supabase.from("crew").insert(rows);
    if (insCrewError) {
      return NextResponse.json({ error: insCrewError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
