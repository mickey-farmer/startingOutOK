import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, getAdminCookieName, getAdminCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.json(
      { error: "Admin login not configured (ADMIN_PASSWORD missing)" },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.password !== password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getAdminCookieName(), token, getAdminCookieOptions());
  return res;
}
