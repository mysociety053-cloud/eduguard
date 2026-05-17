import { Type } from "@google/genai";
import { getGenAI, MODEL_FLASH, withGeminiRetry } from "./gemini";

import type {
  RepeatValue,
  InjuryValue,
  VictimCountValue,
} from "@/data/checklistOptions";

export interface UserInput {
  actions: string[];
  situation: string;
  grade: string;
  repeat: RepeatValue;
  injury: InjuryValue;
  victimCount: VictimCountValue;
  narrative?: string;
}

export interface KeywordExtractionResult {
  statute: string;
  action: string;
  context: string;
  oneLineSummary: string;
}

const SYSTEM_PROMPT = `당신은 한국 아동학대 판례 검색을 돕는 법률 키워드 추출 전문가입니다.

교사가 입력한 사안 정보를 받아, 법제처 OPEN API로 판례를 검색하기 위한 키워드 3개와 위험 신호를 판단해주세요.

[법제처 API 검색 특성]
- 일상 용어는 검색에 거의 잡히지 않습니다. 반드시 법률 용어로 매핑하세요.
- 결과 표현(무죄, 공소기각, 무혐의)은 키워드에 절대 넣지 마세요. 0건 나옵니다.
- 학교명·지역명은 익명화되어 검색에 부적합합니다.

[일상 용어 → 법률 키워드 매핑]
- 훈육·야단·큰소리·꾸짖음·폭언 → 정서학대, 폭언, 지도행위
- 잡다·끌다·밀다·만지다·신체접촉 → 유형력, 신체학대
- 분리·복도세움·자리이동·격리 → 분리조치, 격리
- 휴대전화·소지품 수거 → 휴대전화회수
- 반성문·베껴쓰기·추가과제 → 과제부과
- 차별·활동제외·무시 → 정서학대
- 체벌·때림 → 체벌, 신체학대

[3 키워드 구성 원칙]
- statute: 죄목·법률 분류 핵심 단어 1개 (예: 정서학대, 신체학대, 아동학대)
- action: 행위 특성 핵심 단어 1개 (예: 지도행위, 분리조치, 유형력, 휴대전화회수)
- context: 맥락 핵심 단어 1개 (예: 교사, 학교, 수업)

각 키워드는 띄어쓰기 없는 단일 명사로. 두 단어 이상이면 검색 정밀도가 떨어집니다.

[oneLineSummary]
사용자 사안을 한 문장(40자 내외)으로 요약. 결과 단정 금지("~로 보입니다" 식 금지).
예: "수업 중 떠드는 학생을 한 차례 복도로 분리한 사안"`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    statute: { type: Type.STRING },
    action: { type: Type.STRING },
    context: { type: Type.STRING },
    oneLineSummary: { type: Type.STRING },
  },
  required: ["statute", "action", "context", "oneLineSummary"],
  propertyOrdering: ["statute", "action", "context", "oneLineSummary"],
};

function formatUserInput(input: UserInput): string {
  return [
    `[행위] ${input.actions.join(", ")}`,
    `[상황] ${input.situation}`,
    `[학년] ${input.grade}`,
    input.narrative ? `[자유 서술] ${input.narrative}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function extractKeywords(
  input: UserInput,
): Promise<KeywordExtractionResult> {
  const ai = getGenAI();
  const response = await withGeminiRetry(() =>
    ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `${SYSTEM_PROMPT}\n\n[사용자 입력]\n${formatUserInput(input)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    }),
  );

  const text = response.text;
  if (!text) {
    throw new Error("Gemini 응답이 비어있습니다");
  }

  return JSON.parse(text) as KeywordExtractionResult;
}
