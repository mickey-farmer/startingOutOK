import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) {
    return NextResponse.json({ useSupabase: false });
  }
  const payload = await verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ useSupabase: false });
  }
  return NextResponse.json({ useSupabase: isSupabaseConfigured() });
}
