import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ready: false,
    message: "Live integrations are not configured yet. Connect providers to load real data.",
    accounts: []
  });
}
