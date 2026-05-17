import { NextResponse } from "next/server";
import { checkUsage } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET() {
  const usage = await checkUsage();
  return NextResponse.json(usage);
}
