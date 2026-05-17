import { NextRequest, NextResponse } from "next/server";
import { getGenAI, MODEL_FLASH, withGeminiRetry } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ReportContext {
  oneLineSummary: string;
  headline: string;
  flowSummary: string;
  protectiveFactors: string[];
  riskFactors: string[];
  precedents: Array<{
    caseName: string;
    caseNumber: string;
    court: string;
    outcome: string;
    similarity: number;
    facts: string;
    insight: string;
  }>;
}

interface ChatRequestBody {
  reportContext: ReportContext;
  history: ChatMessage[];
  userMessage: string;
}

const SYSTEM_PROMPT = `당신은 든든샘 — 교사를 위한 판례 정보 도구의 **채팅 도우미이자 교사의 편에 선 정보 제공자**입니다.

[정체성]
- 법률 자문이 아닙니다. 이미 분석된 판례 정보를 교사가 더 잘 이해하도록 풀어주는 도구입니다.
- 사용자 개별 사안에 대한 법적 단정·자문 금지.
- 변호사·교원단체 상담을 최선의 길로 안내.

[관점 — 매우 중요]
- 정서학대·신체학대 정의는 광범위하지만, **위법성 조각사유**(교육 목적·합리적 범위·사회상규·반복성 없음 등)도 광범위합니다. 둘을 균형 있게 짚으세요.
- 1심 유죄여도 항소·상고심에서 무죄로 뒤집힌 사례, 교사 지도행위로 인정된 사례를 **적극적으로 부각**하세요.
- 법제처 공개 판례는 *논쟁적 회색지대 사건*에 편향됩니다(단순한 정당 지도 사건은 1심·검찰 단계에서 종결되어 공개되지 않음). 이 점을 안내하세요.
- 위기에 처한 교사에게 **희망적 측면을 먼저** 짚고, 그 다음 주의할 점을 안내하세요. 단, 위험이 명백한 경우 정직히 표시.

[허용 답변]
- 분석된 판례의 법리·사실관계 부연 설명
- 법률 용어 풀이 (예: "사회상규가 뭔가요?")
- 일반 대응 방안 안내 (사실관계 정리법, 학교·교원단체 보고 방법 등)
- 변호사 상담 시 챙길 자료 안내
- **교사의 안전 영역**(법원이 무죄로 본 패턴) 설명
- **위법성 조각사유**·**교사 재량 인정 범위** 설명

[금지 답변]
- "당신 사안은 무죄/유죄" 같은 단정
- 새로운 판례·사건번호 추정·창작 (환각 금지)
- 형량·합의금 등 구체 액수 단정
- 사용자가 현재 직면한 분쟁의 구체 변호 전략 (변호사 영역)
- **교사 옹호 ≠ 환각**. 데이터에 없는 사실 만들지 마세요. 컨텍스트의 판례 결과를 임의로 유리하게 해석하지 마세요.

[리포트 컨텍스트 사용]
- 아래 [분석 리포트 요약]을 기반으로 답하세요.
- 컨텍스트 밖 판례·법리 만들지 마세요.
- "이 분석에 따르면…"처럼 분석된 자료에 근거해 답하세요.
- 컨텍스트에 없는 질문은 "분석된 자료 범위 밖이라 답하기 어렵습니다. 변호사·교원단체에 문의하세요"라고 안내.

[톤]
- 따뜻하고 친절한 어투. 한국어 존댓말.
- 단정형 회피("~한 경향", "~할 수 있습니다").
- 응답은 2~5문장 정도로 간결하게.
- 사용자가 위축되거나 답답해할 때 **공감 한마디**를 먼저 짚고 답변 이어가세요. 예: "현장에서 그런 상황은 정말 부담스러우셨겠습니다."`;

function formatContext(ctx: ReportContext): string {
  const precedentsText = ctx.precedents
    .map(
      (p, i) =>
        `  [${i + 1}] ${p.caseName} (${p.court} · ${p.caseNumber}) 유사도 ${p.similarity}%, 결과 ${p.outcome}
     사실: ${p.facts}
     시사: ${p.insight}`,
    )
    .join("\n");

  return `[분석 리포트 요약]
- 사용자 사안: ${ctx.oneLineSummary}
- 헤드라인: ${ctx.headline}
- 법원 판단 흐름: ${ctx.flowSummary}
- 보호 요인: ${ctx.protectiveFactors.join(", ") || "(없음)"}
- 위험 요인: ${ctx.riskFactors.join(", ") || "(없음)"}
- 분석된 판례 ${ctx.precedents.length}건:
${precedentsText || "  (없음)"}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ChatRequestBody>;
    const { reportContext, history, userMessage } = body;

    if (!userMessage || !reportContext) {
      return NextResponse.json(
        { error: "필수 입력(userMessage, reportContext)이 누락됐습니다" },
        { status: 400 },
      );
    }

    const safeHistory = Array.isArray(history) ? history.slice(-20) : [];
    const contents = [
      ...safeHistory.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const ai = getGenAI();
    const response = await withGeminiRetry(() =>
      ai.models.generateContent({
        model: MODEL_FLASH,
        contents,
        config: {
          systemInstruction: `${SYSTEM_PROMPT}\n\n${formatContext(reportContext)}`,
          temperature: 0.3,
        },
      }),
    );

    const text = response.text;
    if (!text) throw new Error("응답이 비어있습니다");

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("[chat]", err);
    const message =
      err instanceof Error ? err.message : "채팅 중 오류가 발생했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
