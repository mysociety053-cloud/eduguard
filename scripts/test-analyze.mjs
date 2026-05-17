// 5b 통합 검증용. 끝나면 삭제.
const input = {
  actions: ["분리", "큰소리"],
  situation: "수업중",
  grade: "초고학년",
  narrative:
    "수업 중 떠드는 학생을 한 차례 복도로 분리시켰는데 학부모가 정서학대로 신고함",
};

const t0 = Date.now();
const res = await fetch("http://localhost:3000/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(input),
});
const data = await res.json();
const t = ((Date.now() - t0) / 1000).toFixed(1);

console.log(`\n--- HTTP ${res.status} | ${t}s ---\n`);

if (!res.ok) {
  console.log(JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log(`oneLineSummary: ${data.oneLineSummary}`);
console.log(`headline:       ${data.headline}`);
console.log(
  `stats: 무죄·취지=${data.stats.notGuilty} 유죄=${data.stats.guilty} 기타=${data.stats.other}`,
);
console.log(`totalFound(검색총건수): ${data.totalFound}`);
console.log(`riskFlag: ${data.riskFlag}`);
console.log(`\nflowSummary:\n  ${data.flowSummary}`);
console.log(`\nprotectiveFactors: ${data.protectiveFactors.join(" / ")}`);
console.log(`riskFactors:       ${data.riskFactors.join(" / ")}`);
console.log(`\n분석된 판례 ${data.precedents.length}건:`);
for (const p of data.precedents) {
  console.log(
    `\n  [${p.similarity}%·${p.outcome}] ${p.caseName}`,
  );
  console.log(`    ${p.court} ${p.caseNumber} ${p.decidedAt}`);
  console.log(`    사실: ${p.facts}`);
  console.log(`    시사: ${p.insight}`);
  console.log(
    `    quote 검증: sim=${p.similarityQuote ? "OK" : "null"} out=${p.outcomeQuote ? "OK" : "null"} kr=${p.keyReasoning.map((r) => (r.quote ? "OK" : "null")).join(",")}`,
  );
}
