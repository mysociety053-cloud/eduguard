import dns from "node:dns";
import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
dns.setDefaultResultOrder("ipv4first");

// .env.local 수동 로드
const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const OC = env.LAW_API_OC ?? "eduguard";
const BASE = "http://www.law.go.kr/DRF/lawSearch.do";

const cases = [
  {
    id: "분리조치",
    desc: "초등 5학년 담임. 수업 중 떠드는 학생을 한 차례 복도로 5분간 분리시켰는데 학부모가 정서학대로 신고함",
  },
  {
    id: "휴대폰회수",
    desc: "고등학교 교사. 수업 중 휴대전화를 사용하는 학생에게 학교 규칙에 따라 회수하자 학부모가 항의함",
  },
  {
    id: "신체접촉",
    desc: "초등 3학년 교사. 친구를 때리려는 학생의 팔을 잡아 제지했는데, 학생이 손목이 빨개졌다고 함",
  },
];

const PROMPT_TEMPLATE = (desc) => `다음 한국 교사 사안과 유사한 한국 대법원·고등법원·지방법원 아동학대 판례를 1-3건 알려주세요.

사안: ${desc}

[필수 출력 형식]
[판례 1]
- 사건번호: (예: 2020도12920)
- 법원·선고일: (예: 대법원 2024.10.08)
- 사건명:
- 핵심 본문 인용: "..."
- 결과: 무죄/유죄 등

확실하지 않으면 "확실하지 않음"이라고만 답하세요. 사건번호를 추측해서 만들지 마세요.`;

async function askGemini(desc) {
  const r = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: PROMPT_TEMPLATE(desc),
    config: { temperature: 0.1 },
  });
  return r.text ?? "";
}

async function verifyCaseNumber(cn) {
  const params = new URLSearchParams({
    OC,
    target: "prec",
    type: "JSON",
    query: cn,
    display: "5",
  });
  const res = await fetch(`${BASE}?${params}`);
  const data = await res.json();
  const prec = data.PrecSearch?.prec;
  const hits = Array.isArray(prec) ? prec : prec ? [prec] : [];
  return hits.find((h) => (h.사건번호 ?? "").includes(cn));
}

let totalCited = 0;
let totalReal = 0;
let totalHallucinated = 0;

for (const c of cases) {
  console.log(`\n========== [${c.id}] ${c.desc} ==========\n`);
  const answer = await askGemini(c.desc);
  console.log("[Gemini 응답]");
  console.log(answer);

  // 사건번호 정규식: 4자리 연도 + 한자 1-3자(도/노/고합/고단/가합/가단/형/민 등) + 숫자
  const matches = [
    ...answer.matchAll(/(\d{4})[가-힣]{1,4}\d+/g),
  ].map((m) => m[0]);
  const unique = [...new Set(matches)];
  console.log(`\n[추출된 사건번호] ${unique.length ? unique.join(", ") : "없음"}`);

  console.log("\n[법제처 실재 검증]");
  for (const cn of unique) {
    totalCited++;
    const found = await verifyCaseNumber(cn);
    if (found) {
      totalReal++;
      console.log(`  ✓ 실재 — ${cn} : ${(found.사건명 ?? "").slice(0, 70)}`);
    } else {
      totalHallucinated++;
      console.log(`  ✗ 환각 의심 — ${cn} : 법제처 공개 판례에서 찾을 수 없음`);
    }
  }
}

console.log(`\n\n=========================================`);
console.log(`총 인용: ${totalCited}건 / 실재: ${totalReal}건 / 환각 의심: ${totalHallucinated}건`);
console.log(
  `환각률: ${totalCited > 0 ? ((totalHallucinated / totalCited) * 100).toFixed(0) : 0}%`,
);
