export type ChannelScope = "national" | "regional";
export type ChannelCategory = "hotline" | "교원단체" | "교육청" | "기타";

export interface LegalChannel {
  id: string;
  name: string;
  scope: ChannelScope;
  region?: string;
  category: ChannelCategory;
  /** tel: 링크로 발신 가능한 번호. 정확성이 확실치 않으면 비워둘 것 (환각 방지). */
  phone?: string;
  /** 공식 웹사이트 URL. 확실치 않으면 searchHint 사용. */
  website?: string;
  hours?: string;
  description: string;
  fee?: string;
  /** 사용자가 공식 정보를 직접 검색할 때 쓸 키워드 (전화번호 추측 대신). */
  searchHint?: string;
  lastVerifiedAt: string;
}

/**
 * Phase 1 MVP 데이터.
 * 1395만 정부 공개 정보로 확실 검증. 교원단체는 기관명·역할·검색 키워드 안내.
 * 지역별 채널은 Phase 2에서 보강 예정 (헌장 §9).
 */
export const NATIONAL_CHANNELS: LegalChannel[] = [
  {
    id: "1395",
    name: "교권보호 직통전화 1395",
    scope: "national",
    category: "hotline",
    phone: "1395",
    hours: "평일 09:00-18:00 (전문 상담) · 안내는 24시간",
    description:
      "교육부·시도교육청이 함께 운영하는 교원 직통전화. 교권 침해·아동학대 신고 관련 1차 안내와 전문 상담 연계, 심리·법률 지원 안내를 제공합니다.",
    fee: "무료",
    lastVerifiedAt: "2026-05-17",
  },
  {
    id: "kfta",
    name: "한국교원단체총연합회 (교총)",
    scope: "national",
    category: "교원단체",
    searchHint: "한국교원단체총연합회 교권옹호",
    description:
      "회원 교사 대상 법률지원·소송지원·교권 옹호 활동을 운영합니다. 정확한 연락처와 시도별 지회 정보는 공식 사이트에서 확인하시기 바랍니다.",
    fee: "회원 무료, 비회원은 사안에 따라 다름",
    lastVerifiedAt: "2026-05-17",
  },
  {
    id: "ktu",
    name: "전국교직원노동조합 (전교조)",
    scope: "national",
    category: "교원단체",
    searchHint: "전교조 법률지원실",
    description:
      "조합원 대상 법률지원·교권 옹호 활동을 운영하며 16개 시도 지부를 둡니다. 지부별 연락처는 공식 사이트에서 확인하시기 바랍니다.",
    fee: "조합원 무료",
    lastVerifiedAt: "2026-05-17",
  },
  {
    id: "kunion",
    name: "교사노조 (시도 교사노동조합)",
    scope: "national",
    category: "교원단체",
    searchHint: "시도 교사노동조합 법률지원",
    description:
      "전국 16개 시도 단위 교사노동조합. 조합원 대상 법률지원·교권 보호. 지역별 가입과 연락처는 공식 사이트에서 확인하시기 바랍니다.",
    fee: "조합원 무료",
    lastVerifiedAt: "2026-05-17",
  },
  {
    id: "regional-edu-office",
    name: "근무지 시도교육청 교권보호위원회",
    scope: "national",
    category: "교육청",
    searchHint: "[근무지 시도명] 교육청 교권보호위원회",
    description:
      "각 시도교육청은 교권보호위원회를 운영하며 교권 침해 신고 접수·자문·법률지원 연계 기능을 합니다. 본인이 근무하는 시도교육청 홈페이지의 교권보호 메뉴를 확인하시기 바랍니다.",
    fee: "무료",
    lastVerifiedAt: "2026-05-17",
  },
];
