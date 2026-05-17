import { NextRequest, NextResponse } from "next/server";
import { extractKeywords, type UserInput } from "@/lib/extractKeywords";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<UserInput>;

    if (!Array.isArray(body.actions) || body.actions.length === 0) {
      return NextResponse.json(
        { error: "actions(배열)가 1개 이상 필요합니다" },
        { status: 400 },
      );
    }
    if (!body.situation || !body.grade) {
      return NextResponse.json(
        { error: "situation, grade가 필요합니다" },
        { status: 400 },
      );
    }

    const result = await extractKeywords({
      actions: body.actions,
      situation: body.situation,
      grade: body.grade,
      narrative: body.narrative,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[extract-keywords]", err);
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
