# CLAUDE.md — Claude Code 작업 가이드

> 미래 Claude 세션이 빠르게 컨텍스트를 잡을 수 있도록 정리.
> 깊은 설계는 [`PROJECT_CHARTER.md`](./PROJECT_CHARTER.md) v4 참조.

## 한 줄 요약

든든샘(코드명 EduGuard): 교사가 아동학대 신고 사안과 유사한 *대법원·고등법원·지방법원 판례*를 법제처 OPEN API 실시간으로 검색·분석해 일상 언어로 풀어주는 무료 도구. Next.js 16 + Gemini 2.5 Flash + 법제처 API.

## 자주 손볼 파일

| 변경 의도 | 손볼 파일 |
|---|---|
| 사안 입력 항목 추가/조정 | `data/checklistOptions.ts` + `app/analyze/page.tsx` |
| 키워드 매핑·프롬프트 A | `lib/extractKeywords.ts` |
| 판례 검색 알고리즘·prefilter | `lib/lawApi.ts` |
| 판례 분석 프롬프트 B-1 | `lib/analyzePrecedent.ts` |
| 종합 분석 프롬프트 B-2 | `lib/summarizeReport.ts` |
| 환각 방어 (quote 매칭) | `lib/analyzePrecedent.ts`의 `verifyQuotes()` |
| 위험 신호 판정 (체크박스 기반) | `lib/determineRisk.ts` |
| 사용량 한도 (쿠키) | `lib/rateLimit.ts` |
| 분석 엔진 버전 (법령 개정 시) | `lib/version.ts` |
| 법률지원 채널 데이터 | `data/legalChannels.ts` |

## 절대 변경 금지 / 매우 신중

- **변호사법 109조 정체성** — UI 텍스트에서 "법률 자문", "법적 단정", "당신의 사안은 ~한다" 같은 표현 금지. *경향*·*~할 수 있습니다* 형식
- **법제처 실시간 호출** — 캐싱으로 실시간성 약화하면 *AI 환각 차별점*이 무너짐
- **quote 매칭 검증** — LLM 인용을 그대로 화면에 노출하지 말 것. 항상 `verifyQuotes()` 통과한 것만
- **위험 신호 LLM 판정 부활 금지** — 다층 LLM 모순 학습 후 사용자 체크박스로 이동. 다시 LLM에 맡기면 환각 모순 재발

## 자주 쓰는 명령

```bash
npm run dev                                  # 개발 서버 (Turbopack)
node scripts/test-analyze.mjs                # 전체 분석 흐름 검증
node scripts/verify-hallucination.mjs        # Gemini 환각률 재측정
```

## 환경 주의 사항

- **Windows + Node 24 + 법제처 API**: IPv6 fallback에 75초 hang. `lib/lawApi.ts`에 `dns.setDefaultResultOrder("ipv4first")` 이미 적용
- **`next.config.ts`**: `reactStrictMode: false` (dev에서 useEffect 두 번 실행 부작용 회피) + `allowedDevOrigins: ["192.168.45.98", ...]`
- **한국어 curl**: Git Bash에서 한국어 인자 cp949 인코딩으로 깨짐. 검증 시 Node `.mjs` 스크립트로 (UTF-8 보장)

## 작업 원칙 (PROJECT_CHARTER.md §15)

1. **헌장을 기준으로** — 헌장과 어긋난 결정은 사용자 확인 후
2. **작게 자주** — 큰 변경 X, 검증 후 다음 단계
3. **이유 설명** — 의존성·구조 변경 시 사유 명시
4. **변호사법 109조 의식**
5. **무료 운영의 정직함** — 광고·트래킹·데이터 수집 금지

## 코드 컨벤션

- 주석은 **WHY**만. WHAT은 코드가 말함
- 한국어 식별자(`판례일련번호`)는 *법제처 API 응답 구조 그대로* 두기. 영문 변환 시 일관성 깨짐
- 단정형 UI 텍스트 금지 (변호사법). 코드 주석은 평어체 OK
- TypeScript `interface` 우선, `type`은 union·utility에만

## 더 알고 싶다면

- 설계 결정·실증 검증 결과: `PROJECT_CHARTER.md` v4
- 폴더 구조·셋업·운영 명령: `README.md`
- 이전 헌장 변천: `teacher_shield_project_charter.md` → `..._v2.md` → `PROJECT_CHARTER.md` (v3 → v4)
