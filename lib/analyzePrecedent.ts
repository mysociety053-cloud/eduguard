import { Type } from "@google/genai";
import { getGenAI, MODEL_FLASH, withGeminiRetry } from "./gemini";

export type Outcome =
  | "not_guilty"
  | "guilty"
  | "guilty_overturned"
  | "remand_for_acquittal"
  | "unclear";

export interface KeyReasoningRaw {
  label: string;
  explanation: string;
  quote: string | null;
}

export interface PrecedentAnalysisRaw {
  similarity: number;
  similarityQuote: string | null;
  outcome: Outcome;
  outcomeQuote: string | null;
  keyReasoning: KeyReasoningRaw[];
  facts: string;
  differences: string[];
  insight: string;
}

const SYSTEM_PROMPT = `당신은 한국 아동학대 판례를 교사 사용자에게 일상 언어로 풀어주는 분석가입니다.

[입력]
- 사용자 사안: 교사가 입력한 사안 한 문장 요약
- 판례 본문: 판시사항 + 판결요지 + 주문

[원칙 — 매우 중요]
1. quote 필드들(similarityQuote, outcomeQuote, keyReasoning[].quote)에는
   본문에 글자 그대로 존재하는 문구만 적으세요. 가공·요약 금지.
2. 본문에서 해당 근거를 찾을 수 없으면 quote는 null로 설정하세요.
3. similarity는 사용자 사안과의 사실관계 유사도(0~100). 행위·맥락이 비슷할수록 높음.
   결과(유무죄)는 similarity에 영향을 주지 않습니다.
4. outcome는 판례의 최종 결과:
   - not_guilty: 무죄 선고
   - guilty: 유죄 확정
   - guilty_overturned: 1심 유죄 → 항소심에서 파기·무죄
   - remand_for_acquittal: 무죄 취지 파기환송
   - unclear: 본문만으로 결과가 명확하지 않음
5. facts, insight는 단정형 금지. "~로 보입니다", "~한 경향이 있습니다" 식으로.
6. insight는 사용자 사안에 대한 시사점 한 문장.
7. differences는 사용자 사안과 판례의 차이점 1~3개, 짧게.
8. keyReasoning은 1~3개. 법원이 판단의 근거로 든 핵심 사유.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    similarity: { type: Type.NUMBER },
    similarityQuote: { type: Type.STRING, nullable: true },
    outcome: {
      type: Type.STRING,
      enum: [
        "not_guilty",
        "guilty",
        "guilty_overturned",
        "remand_for_acquittal",
        "unclear",
      ],
    },
    outcomeQuote: { type: Type.STRING, nullable: true },
    keyReasoning: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          explanation: { type: Type.STRING },
          quote: { type: Type.STRING, nullable: true },
        },
        required: ["label", "explanation"],
      },
    },
    facts: { type: Type.STRING },
    differences: { type: Type.ARRAY, items: { type: Type.STRING } },
    insight: { type: Type.STRING },
  },
  required: [
    "similarity",
    "outcome",
    "keyReasoning",
    "facts",
    "differences",
    "insight",
  ],
};

export async function analyzePrecedent(input: {
  userSummary: string;
  body: string;
}): Promise<PrecedentAnalysisRaw> {
  const ai = getGenAI();
  const prompt = `${SYSTEM_PROMPT}\n\n[사용자 사안]\n${input.userSummary}\n\n[판례 본문]\n${input.body}`;
  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        temperature: 0.1,
      },
    }),
  );
  const text = response.text;
  if (!text) throw new Error("판례 분석 응답이 비어있습니다");
  return JSON.parse(text) as PrecedentAnalysisRaw;
}

/**
 * 환각 방어 — quote가 실제 본문에 substring으로 있는지 확인.
 * 없으면 null로 마킹해서 사용자 화면에서는 인용으로 노출하지 않는다.
 * 공백·한국어 인용부호는 normalize.
 */
export function verifyQuotes(
  raw: PrecedentAnalysisRaw,
  body: string,
): PrecedentAnalysisRaw {
  const norm = (s: string) =>
    s.replace(/\s+/g, "").replace(/[「」『』""''()()「」]/g, "");
  const normBody = norm(body);

  const check = (quote: string | null): string | null => {
    if (!quote) return null;
    return normBody.includes(norm(quote)) ? quote : null;
  };

  return {
    ...raw,
    similarityQuote: check(raw.similarityQuote),
    outcomeQuote: check(raw.outcomeQuote),
    keyReasoning: raw.keyReasoning.map((r) => ({
      ...r,
      quote: check(r.quote ?? null),
    })),
  };
}
