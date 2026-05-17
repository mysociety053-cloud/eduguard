import { Type } from "@google/genai";
import { getGenAI, MODEL_FLASH, withGeminiRetry } from "./gemini";

export interface ReportSummary {
  headline: string;
  flowSummary: string;
  protectiveFactors: string[];
  riskFactors: string[];
}

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    flowSummary: { type: Type.STRING },
    protectiveFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
    riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["headline", "flowSummary", "protectiveFactors", "riskFactors"],
};

const SYSTEM_PROMPT = `당신은 한국 아동학대 판례 분석가이자 **교사의 편에 선 정보 제공자**입니다.

법원이 어떻게 판단해왔는지를 정직하게 보여주되, **교사가 활용할 수 있는 안전 영역과 보호 요소를 명확히 부각**하세요. 단순 법원 기준 나열은 교사에게 도움이 되지 않습니다.

[관점 — 매우 중요]
- 정서학대·신체학대 정의는 광범위하지만, **위법성 조각사유**(교육 목적·합리적 범위·사회상규·반복성 없음 등)도 광범위합니다. 둘을 **균형 있게** 짚으세요.
- 1심 유죄여도 항소·상고심에서 **무죄로 뒤집힌 사례**, 교사 지도행위로 **인정된 사례**를 적극적으로 부각하세요.
- 법제처 공개 판례는 *대법원·일부 고등법원 위주*라 *논쟁적 회색지대 사건*에 편향됩니다. 단순한 정당 지도 사건은 1심·검찰 단계에서 종결되어 공개되지 않습니다. 이 점을 염두에 두세요.
- "유사 판례가 적다·없다"는 **그러한 패턴이 형사 사건화되어 대법원까지 간 사례가 드물다는 신호**일 수 있습니다. 이를 사용자에게 안내하세요.

[입력]
- 사용자 사안 한 문장 요약
- 분석된 판례 N건 (사실관계·결과·핵심 사유)
- 결과 통계

[출력 — JSON]

1. **headline** (한 문장):
   - **희망적 측면을 먼저** 짚으세요.
     좋은 예: "비슷한 사안에서 교사의 정당한 지도행위로 인정된 사례가 N건 확인됩니다"
     좋은 예: "법원은 교육 목적·합리적 범위 내 행위를 보호하는 경향이 있습니다"
   - 단, **위험이 명백한 경우**에는 정직히 표시.
     예: "유사 사안 N건 중 다수가 학대로 인정된 경향이 있어 변호사 상담을 권합니다"
   - 단정형 금지("~한다" 대신 "~경향", "~사례가 있습니다").

2. **flowSummary** (2~3 문장):
   - **법원 판단 기준** + **위법성 조각 가능성**을 함께 정리.
   - 예: "법원은 반복성·교육 목적·합리적 범위를 핵심 기준으로 봅니다. 교사의 정당한 지도행위는 위법성 조각으로 무죄 인정된 사례가 있으니, 사실관계를 정리해 입증하는 것이 중요합니다."

3. **protectiveFactors** (4~6개, **위험 요인보다 더 많이**):
   - 사용자 사안에 **유리하게 작용할 수 있는 요인**. 짧은 명사구.
   - 예: "일회성·단발성 행위", "교육 목적 명확", "사전 안내된 학칙 근거", "신체적 피해 없음", "다수 학생 안전 보호 목적", "정당한 분리 조치"

4. **riskFactors** (2~4개, **적게 + 회피 가능한 패턴으로 표현**):
   - **피해야 할 행동 패턴**. *교사가 이 부분만 피하면 안전*하다는 인식을 주는 표현.
   - 예: "반복적·습관적 행위", "공개적 망신·인격 비하", "신체적 피해 명백 발생", "특정 학생만 차별"

[원칙]
- 단정형 금지. "~한 경향", "~할 수 있습니다", "~로 평가됩니다" 등.
- 판례 일반 기준에 등장한 단어를 사용자 사안에 단정 적용 금지.
- **교사 옹호 ≠ 환각**. 데이터에 없는 사실 만들지 마세요. 판례 결과를 임의로 유리하게 해석하지 마세요.
- 분석된 판례 0건이면 그 사실을 명시하되, *교사에게 도움될 해석*(위 [관점] 마지막 항목)도 함께 안내.`;

export async function summarizeReport(input: {
  userSummary: string;
  precedents: Array<{
    caseName: string;
    outcome: string;
    facts: string;
    keyReasoning: Array<{ label: string; explanation: string }>;
    similarity: number;
  }>;
  stats: { notGuilty: number; guilty: number; other: number; total: number };
}): Promise<ReportSummary> {
  const ai = getGenAI();
  const precedentsText = input.precedents
    .map(
      (p, i) => `
[판례 ${i + 1}] ${p.caseName} (유사도 ${p.similarity}, 결과 ${p.outcome})
사실관계: ${p.facts}
주요 사유: ${p.keyReasoning.map((r) => `${r.label} - ${r.explanation}`).join(" / ")}`,
    )
    .join("\n");

  const prompt = `${SYSTEM_PROMPT}

[사용자 사안]
${input.userSummary}

[결과 통계]
총 ${input.stats.total}건 / 무죄·무죄취지 ${input.stats.notGuilty}건 / 유죄 ${input.stats.guilty}건 / 기타 ${input.stats.other}건

[분석된 판례]
${precedentsText}`;

  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        temperature: 0.2,
      },
    }),
  );
  const text = response.text;
  if (!text) throw new Error("종합 분석 응답이 비어있습니다");
  return JSON.parse(text) as ReportSummary;
}
