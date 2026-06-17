import { NextResponse } from "next/server";
import { activeProviderId } from "@/lib/data-providers/providerRegistry";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "healthy",
    provider: activeProviderId(),
    experimental365: process.env.ENABLE_365_EXPERIMENTAL === "true",
  });
}
