import type {
  RepeatValue,
  InjuryValue,
  VictimCountValue,
} from "@/data/checklistOptions";

export interface RiskSignalInput {
  repeat: RepeatValue;
  injury: InjuryValue;
  victimCount: VictimCountValue;
}

export interface RiskAssessment {
  flag: boolean;
  reasons: string[];
}

/**
 * 위험 신호 판정 — LLM에 맡기지 않고 사용자가 체크한 항목으로 결정론적으로 판단.
 * 1개라도 위험 신호면 flag=true. reasons는 어떤 신호인지 짧은 명사구.
 */
export function determineRisk(input: RiskSignalInput): RiskAssessment {
  const reasons: string[] = [];
  if (input.repeat === "반복적") {
    reasons.push("반복적 행위");
  }
  if (input.injury === "중간") {
    reasons.push("중간 정도의 신체적 피해(멍·통증 지속)");
  }
  if (input.injury === "심각") {
    reasons.push("심각한 신체적 피해(부상·치료 필요)");
  }
  if (input.victimCount === "다수") {
    reasons.push("다수 학생 관련(4명 이상)");
  }
  return { flag: reasons.length > 0, reasons };
}
