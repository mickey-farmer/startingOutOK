import { NextResponse } from "next/server";
import { getDirectory } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDirectory();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load directory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
