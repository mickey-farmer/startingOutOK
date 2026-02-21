import { NextResponse } from "next/server";
import { getCastingCallsList } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCastingCallsList();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load casting calls";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
