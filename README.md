# 든든샘 (EduGuard)

> 아동학대 신고에 직면한 교사가 자기 사안과 유사한 판례를 쉽게 찾고
> 일상 언어로 이해할 수 있도록 돕는, 모두에게 무료인 AI 기반 판례 탐색 도구.

**한국어 표시명**: 든든샘 · **코드명**: EduGuard
**상태**: Phase 1 MVP 구현 완료 (2026-05-17)

자세한 설계·결정은 [`PROJECT_CHARTER.md`](./PROJECT_CHARTER.md) (v4) 참조.

## 핵심 차별점

- **AI 환각 차단** — 법제처 OPEN API에서 매번 실시간 조회 + LLM 인용 문장을 원문 매칭으로 검증.
  (다른 AI 도구 직접 사용 시 인용 판례의 약 75%가 환각, 자체 검증 결과)
- **변호사법 109조 안전** — 법률 자문이 아닌 *판례 정보 제공* 정체성
- **무료·익명** — 가입 없음, 입력 본문 분석 직후 폐기

## 기술 스택

- Next.js 16+ (App Router, Turbopack) · TypeScript · Tailwind CSS v4
- Gemini 2.5 Flash (`@google/genai`) · 법제처 OPEN API
- 배포: Vercel · DB: Phase 1 쿠키 / Phase 2 Supabase

## 개발 환경 셋업

요구 사항: Node.js 20+, npm 10+, Git.

1. `.env.local.example`을 복사해 `.env.local` 생성
2. `GEMINI_API_KEY` 채우기 ([Google AI Studio](https://aistudio.google.com/apikey)에서 무료 발급)
3. 의존성 설치 및 dev 서버 실행:

```bash
npm install
npm run dev
```

→ http://localhost:3000

## 폴더 구조

```
app/
├── page.tsx                  # 랜딩
├── analyze/page.tsx          # 사안 입력 (client)
├── report/
│   ├── loading.tsx
│   └── [sessionId]/page.tsx  # 분석 리포트 (client, fetch /api/analyze)
├── support/page.tsx          # 법률지원 채널
├── api/
│   ├── analyze/route.ts      # 통합 분석 (키워드 → 검색 → 분석 → 종합)
│   ├── extract-keywords/route.ts
│   └── search-precedents/route.ts
├── layout.tsx
└── globals.css

components/
├── DisclaimerBanner.tsx     # footer 면책
├── PrintButton.tsx          # PDF 출력 (window.print)
├── PrintHeader.tsx          # 인쇄용 머리말
└── ReportLoadingView.tsx    # 로딩 UI 컴포넌트

lib/
├── gemini.ts                # Gemini 클라이언트 + withGeminiRetry
├── extractKeywords.ts       # 프롬프트 A
├── analyzePrecedent.ts      # 프롬프트 B-1 + verifyQuotes
├── summarizeReport.ts       # 프롬프트 B-2
├── extractPrecedentBody.ts  # 판시사항/판결요지/주문 추출
├── lawApi.ts                # 법제처 API + 4단계 확장 + prefilter
├── determineRisk.ts         # 위험 신호 결정론적 판정
├── rateLimit.ts             # 사용량 한도 (쿠키)
└── version.ts               # 엔진 버전 상수

data/
├── checklistOptions.ts      # 사안 입력 옵션
└── legalChannels.ts         # 법률지원 채널 DB

types/analysis.ts            # 분석 결과 타입

scripts/                     # 검증·테스트용 (배포 제외)
├── test-search.mjs
├── test-analyze.mjs
├── count-precedents.mjs
└── verify-hallucination.mjs
```

## 운영 명령

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint
```

검증 스크립트 (필요 시):
```bash
node scripts/test-search.mjs           # 법제처 검색 결과 확인
node scripts/test-analyze.mjs          # 전체 분석 흐름 검증
node scripts/count-precedents.mjs      # 판례 풀 규모 측정
node scripts/verify-hallucination.mjs  # Gemini 환각률 측정
```

## 작업 원칙

`PROJECT_CHARTER.md`에 명시. 요약:

1. **헌장을 기준으로** — 헌장과 어긋난 결정은 사용자 확인 후
2. **작게 자주** — 큰 변경 X, 작은 단위 + 검증
3. **이유를 설명** — 의존성·구조 변경은 사유 명시
4. **변호사법 109조 의식** — 법률 자문이 아닌 정보 제공
5. **무료 운영의 정직함** — 광고·트래킹·데이터 수집 절대 금지

## 라이선스 · 책임

본 서비스는 **법률 자문이 아닌 판례 정보 제공** 서비스입니다. 구체적 법률 판단은 변호사와 상담하시기 바랍니다. 입력하신 사안 내용은 분석 직후 즉시 폐기되며 저장되지 않습니다.
