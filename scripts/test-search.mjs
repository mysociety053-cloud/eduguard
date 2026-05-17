// 5a 검증용 임시 스크립트 — 검증 끝나면 삭제.
// 한국어 인코딩 안전(.mjs UTF-8) → curl 한글 깨짐 우회.

const cases = [
  // 사건명 prefilter 추가 후 결과
  { statute: "정서학대", action: "지도행위", context: "수업" },
  { statute: "아동학대", action: "지도행위", context: "교사" },
  { statute: "아동학대", action: "분리조치", context: "학생" },
  { statute: "신체학대", action: "유형력", context: "교사" },
];

for (const body of cases) {
  process.stdout.write(`\n[${body.statute} + ${body.action} + ${body.context}] `);
  const res = await fetch("http://localhost:3000/api/search-precedents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log(`stage=${data.stage} hits=${data.hits?.length ?? 0} total=${data.totalCnt} q="${data.rawQuery}"`);
  if (data.hits?.length) {
    for (const h of data.hits.slice(0, 3)) {
      console.log(`  - [${h.선고일자}] ${h.사건명} (${h.사건번호})`);
    }
  }
}
