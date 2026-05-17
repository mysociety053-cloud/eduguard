import { NextRequest, NextResponse } from "next/server";
import { searchPrecedentsWithFallback } from "@/lib/lawApi";

export const runtime = "nodejs";
export const maxDuration = 30;

interface SearchRequestBody {
  statute?: string;
  action?: string;
  context?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SearchRequestBody;
    const { statute, action, context } = body;

    if (!statute || !action || !context) {
      return NextResponse.json(
        { error: "statute, action, context 모두 필요합니다" },
        { status: 400 },
      );
    }

    const result = await searchPrecedentsWithFallback(statute, action, context);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[search-precedents]", err);
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
