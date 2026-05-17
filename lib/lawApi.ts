import dns from "node:dns";

// Windows + Node 24 + http://www.law.go.kr 조합에서 fetch가 IPv6를 먼저 시도하다
// fallback에 75초 이상 걸리는 문제를 회피. IPv4 우선 시도하도록 강제한다.
dns.setDefaultResultOrder("ipv4first");

const SEARCH_URL = "http://www.law.go.kr/DRF/lawSearch.do";
const SERVICE_URL = "http://www.law.go.kr/DRF/lawService.do";

function getOC(): string {
  const oc = process.env.LAW_API_OC;
  if (!oc) {
    throw new Error("LAW_API_OC 환경변수가 설정되지 않았습니다");
  }
  return oc;
}

export interface PrecedentListItem {
  판례일련번호: string;
  사건명: string;
  사건번호: string;
  선고일자: string;
  법원명: string;
  사건종류명?: string;
  판결유형?: string;
  선고?: string;
}

export interface PrecedentSearchResult {
  hits: PrecedentListItem[];
  stage: 1 | 2 | 3 | 4;
  totalCnt: number;
  rawQuery: string;
}

interface RawSearchResponse {
  PrecSearch?: {
    totalCnt?: string | number;
    prec?: PrecedentListItem | PrecedentListItem[];
  };
}

async function callSearch(
  query: string,
  searchMode: 1 | 2,
  display = 20,
): Promise<{ hits: PrecedentListItem[]; totalCnt: number }> {
  const params = new URLSearchParams({
    OC: getOC(),
    target: "prec",
    type: "JSON",
    query,
    display: String(display),
  });
  if (searchMode === 2) params.set("search", "2");

  const url = `${SEARCH_URL}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`법제처 검색 실패: HTTP ${res.status}`);
  }
  const data = (await res.json()) as RawSearchResponse;
  const prec = data.PrecSearch?.prec;
  const hits = Array.isArray(prec) ? prec : prec ? [prec] : [];
  const totalCnt = Number(data.PrecSearch?.totalCnt ?? hits.length) || 0;
  return { hits, totalCnt };
}

// 사건명에 들어 있어야 우리 도메인(교사 아동학대) 판례로 간주하는 키워드.
const DOMAIN_KEYWORDS = [
  "아동학대",
  "아동복지법",
  "정서학대",
  "신체학대",
  "성적학대",
  "유기·방임",
  "체벌",
  "교권",
];

// 사건명에 들어 있으면 명백히 우리 도메인(교사의 훈육·지도 행위) 밖이라 제외.
// 아동학대 관련 사건이지만 살해·성범죄 등은 교사의 일상 지도 사안과 무관.
const EXCLUDE_KEYWORDS = [
  "살해",
  "치사",
  "강제추행",
  "유사강간",
  "성착취",
  "음행강요",
  "그루밍",
  "통신매체이용음란",
  "촬영물",
  "성폭력",
  "성희롱",
];

function filterByCaseName(hits: PrecedentListItem[]): PrecedentListItem[] {
  return hits.filter((h) => {
    const name = h.사건명 ?? "";
    const hasDomain = DOMAIN_KEYWORDS.some((kw) => name.includes(kw));
    const hasExclude = EXCLUDE_KEYWORDS.some((kw) => name.includes(kw));
    return hasDomain && !hasExclude;
  });
}

/**
 * 4단계 확장 + 사건명 도메인 필터.
 * 헌장 §5의 4단계 확장 + 노이즈 차단을 위한 사건명 prefilter.
 * - 단계 도달 후 사건명 필터로 도메인 외 사건(교사범 등) 제거
 * - 필터 후 1건 이상 남으면 사용, 0건이면 다음 단계로
 */
export async function searchPrecedentsWithFallback(
  statute: string,
  action: string,
  context: string,
): Promise<PrecedentSearchResult> {
  const q3 = `${statute}+${action}+${context}`;
  const q2 = `${statute}+${action}`;
  const q1 = statute;

  // 1차 — 사건명 + 3키워드
  let r = await callSearch(q3, 1);
  let filtered = filterByCaseName(r.hits);
  if (filtered.length >= 1) {
    return { hits: filtered, totalCnt: r.totalCnt, stage: 1, rawQuery: q3 };
  }

  // 2차 — 본문 + 3키워드
  r = await callSearch(q3, 2);
  filtered = filterByCaseName(r.hits);
  if (filtered.length >= 1) {
    return { hits: filtered, totalCnt: r.totalCnt, stage: 2, rawQuery: q3 };
  }

  // 3차 — 본문 + 2키워드
  r = await callSearch(q2, 2);
  filtered = filterByCaseName(r.hits);
  if (filtered.length >= 1) {
    return { hits: filtered, totalCnt: r.totalCnt, stage: 3, rawQuery: q2 };
  }

  // 4차 — 본문 + 1키워드 (안전망)
  r = await callSearch(q1, 2);
  filtered = filterByCaseName(r.hits);
  return { hits: filtered, totalCnt: r.totalCnt, stage: 4, rawQuery: q1 };
}

interface RawServiceResponse {
  PrecService?: Record<string, unknown>;
}

export interface PrecedentDetail {
  판례일련번호?: string;
  사건명?: string;
  사건번호?: string;
  선고일자?: string;
  법원명?: string;
  판시사항?: string;
  판결요지?: string;
  판례내용?: string;
  주문?: string;
  [key: string]: unknown;
}

export async function getPrecedentDetail(id: string): Promise<PrecedentDetail> {
  const params = new URLSearchParams({
    OC: getOC(),
    target: "prec",
    type: "JSON",
    ID: id,
  });
  const url = `${SERVICE_URL}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`법제처 본문 조회 실패: HTTP ${res.status}`);
  }
  const data = (await res.json()) as RawServiceResponse;
  return (data.PrecService ?? {}) as PrecedentDetail;
}
