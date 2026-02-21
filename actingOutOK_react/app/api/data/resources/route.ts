import { NextResponse } from "next/server";
import { getResources } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getResources();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load resources";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
