import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
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

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug query required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("casting_calls").delete().eq("slug", slug);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
