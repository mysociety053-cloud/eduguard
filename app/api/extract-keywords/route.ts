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

    // 검증용 엔드포인트. 위험 신호는 UI에서 받지만 이 라우트는 키워드 추출만 검증해서
    // 기본값(위험 없음)으로 채워 호출한다.
    const result = await extractKeywords({
      actions: body.actions,
      situation: body.situation,
      grade: body.grade,
      repeat: body.repeat ?? "일회성",
      injury: body.injury ?? "없음",
      victimCount: body.victimCount ?? "1명",
      narrative: body.narrative,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[extract-keywords]", err);
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
