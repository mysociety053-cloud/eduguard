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

const SYSTEM_PROMPT = `당신은 한국 아동학대 판례 분석가입니다. 교사 사용자에게 친절한 일상 언어로 풀어주세요.

[입력]
- 사용자 사안 한 문장 요약
- 분석된 판례 N건 (사실관계·결과·핵심 사유)
- 결과 통계

[출력 — JSON]
1. headline: 사용자가 가장 먼저 알아야 할 한 문장. 단정형 금지("경향이 있습니다", "사례가 많습니다" 식으로).
2. flowSummary: 법원의 판단 흐름을 2~3문장으로 풀어 설명. 핵심 기준(반복성·교육목적·합리적범위 등)을 사용자가 이해할 수 있게.
3. protectiveFactors: 사용자 사안에 유리하게 작용할 수 있는 요인 3~5개. 짧은 명사구.
4. riskFactors: 불리하게 작용할 수 있는 요인 3~5개. 짧은 명사구.

[원칙 — 매우 중요]
- 단정형 금지. "~한 경향", "~할 수 있습니다", "~로 평가됩니다" 등.
- 분석된 판례의 정황과 결과를 근거로만 작성. 추정·확장 금지.
- 분석된 판례가 0건이거나 본문이 부실한 경우 그 사실을 명시.
- **판례가 제시한 일반 법리 기준**(예: "반복성·지속시간", "교육 목적 합리적 범위")과
  **사용자 사안의 사실관계**는 명확히 구분하세요. 판례 일반론에 등장한 단어를
  사용자 사안에 단정적으로 적용하지 마세요.
  나쁜 예: "사용자 사안은 반복성이 있어 학대로 평가될 가능성이 높습니다"
  (사용자 사안에 반복이 명시되지 않았는데 추정한 경우)
  좋은 예: "법원은 반복성·지속시간을 중요 기준으로 봅니다. 사용자 사안에서
  반복성 여부를 사실관계로 정리해두시는 것이 도움이 됩니다."`;

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
