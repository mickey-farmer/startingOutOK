import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

type CastingCallPayload = {
  slug: string;
  title: string;
  date?: string | null;
  auditionDeadline?: string | null;
  location?: string | null;
  pay?: string | null;
  type?: string | null;
  union?: string | null;
  under18?: boolean;
  roleCount?: number;
  archived?: boolean;
  description?: string | null;
  director?: string | null;
  filmingDates?: string | null;
  submissionDetails?: string | null;
  sourceLink?: string | null;
  exclusive?: boolean;
  roles?: Array<Record<string, unknown>>;
};

function toDbRow(p: CastingCallPayload) {
  return {
    slug: p.slug,
    title: p.title,
    date: p.date || null,
    audition_deadline: p.auditionDeadline || null,
    location: p.location || null,
    pay: p.pay || null,
    type: p.type || null,
    union_status: p.union || null,
    under18: p.under18 ?? false,
    role_count: p.roleCount ?? (Array.isArray(p.roles) ? p.roles.length : 0),
    archived: p.archived ?? false,
    description: p.description || null,
    director: p.director || null,
    filming_dates: p.filmingDates || null,
    submission_details: p.submissionDetails || null,
    source_link: p.sourceLink || null,
    exclusive: p.exclusive ?? false,
    roles: p.roles ?? [],
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

  let body: CastingCallPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.slug || !body.title) {
    return NextResponse.json({ error: "slug and title required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const row = toDbRow(body);
  const { error } = await supabase.from("casting_calls").upsert(row, { onConflict: "slug" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
