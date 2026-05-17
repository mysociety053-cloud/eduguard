import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const OC = "eduguard";
const BASE = "http://www.law.go.kr/DRF/lawSearch.do";

const DOMAIN = [
  "아동학대",
  "아동복지법",
  "정서학대",
  "신체학대",
  "성적학대",
  "유기·방임",
  "체벌",
  "교권",
];

const EXCLUDE = [
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

async function totalCnt(query, mode) {
  const params = new URLSearchParams({
    OC,
    target: "prec",
    type: "JSON",
    query,
    display: "1",
  });
  if (mode === 2) params.set("search", "2");
  const res = await fetch(`${BASE}?${params}`);
  const data = await res.json();
  return Number(data.PrecSearch?.totalCnt ?? 0);
}

async function fetchAll(query, mode, max = 100) {
  const params = new URLSearchParams({
    OC,
    target: "prec",
    type: "JSON",
    query,
    display: String(max),
  });
  if (mode === 2) params.set("search", "2");
  const res = await fetch(`${BASE}?${params}`);
  const data = await res.json();
  const prec = data.PrecSearch?.prec;
  return Array.isArray(prec) ? prec : prec ? [prec] : [];
}

console.log("\n== 단일 키워드 본문 검색(search=2) totalCnt ==");
for (const kw of ["아동학대", "아동복지법", "정서학대", "신체학대", "체벌", "교권"]) {
  const c = await totalCnt(kw, 2);
  console.log(`  ${kw.padEnd(8)}: ${c.toLocaleString()}건`);
}

console.log("\n== 사건명 검색(search=1, 기본) totalCnt ==");
for (const kw of ["아동학대", "아동복지법"]) {
  const c = await totalCnt(kw, 1);
  console.log(`  ${kw.padEnd(8)}: ${c.toLocaleString()}건`);
}

console.log("\n== 사건명 prefilter 효과 — '아동학대' 사건명 검색 상위 100건 분류 ==");
const hits = await fetchAll("아동학대", 1, 100);
const inDomain = hits.filter((h) =>
  DOMAIN.some((kw) => (h.사건명 ?? "").includes(kw)),
);
const excluded = inDomain.filter((h) =>
  EXCLUDE.some((kw) => (h.사건명 ?? "").includes(kw)),
);
const kept = inDomain.filter(
  (h) => !EXCLUDE.some((kw) => (h.사건명 ?? "").includes(kw)),
);
console.log(`  전체 응답: ${hits.length}건`);
console.log(`  도메인 키워드 포함: ${inDomain.length}건`);
console.log(`  → 제외 키워드 적용 후 남음: ${kept.length}건`);
console.log(`  → 제외된 (살해·성범죄 등): ${excluded.length}건`);

console.log("\n== 사건명에 '교사' 단어 포함 ==");
const teacher1 = await totalCnt("교사 아동학대", 1);
const teacher2 = await totalCnt("교사 아동학대", 2);
console.log(`  사건명 검색: ${teacher1.toLocaleString()}건 (※ 형법 교사범 포함)`);
console.log(`  본문 검색  : ${teacher2.toLocaleString()}건`);
