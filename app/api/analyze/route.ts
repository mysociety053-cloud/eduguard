import { NextRequest, NextResponse } from "next/server";
import { extractKeywords, type UserInput } from "@/lib/extractKeywords";
import {
  searchPrecedentsWithFallback,
  getPrecedentDetail,
} from "@/lib/lawApi";
import { extractRelevantBody } from "@/lib/extractPrecedentBody";
import { analyzePrecedent, verifyQuotes } from "@/lib/analyzePrecedent";
import { summarizeReport } from "@/lib/summarizeReport";
import { determineRisk } from "@/lib/determineRisk";
import { checkUsage, recordUsage } from "@/lib/rateLimit";
import type { AnalysisReport, PrecedentAnalysis } from "@/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PRECEDENTS = 7;
const SIMILARITY_THRESHOLD = 30;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<UserInput> & {
      sessionId?: string;
    };

    if (
      !Array.isArray(body.actions) ||
      body.actions.length === 0 ||
      !body.situation ||
      !body.grade
    ) {
      return NextResponse.json(
        { error: "필수 입력값(행위·상황·학년)이 비어있습니다" },
        { status: 400 },
      );
    }

    // 사용량 한도 체크 (헌장 §8 — 일일 3회·월 10회).
    const usage = await checkUsage();
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "사용량 한도 초과", usage },
        { status: 429 },
      );
    }

    const sessionId = body.sessionId ?? crypto.randomUUID();
    const generatedAt = new Date().toISOString();

    // 위험 신호는 사용자가 체크한 항목으로 결정론적으로 판단 (LLM 무관).
    const risk = determineRisk({
      repeat: body.repeat ?? "일회성",
      injury: body.injury ?? "없음",
      victimCount: body.victimCount ?? "1명",
    });

    // 1. 키워드 추출
    console.log("[analyze] step1 extract-keywords");
    const kw = await extractKeywords({
      actions: body.actions,
      situation: body.situation,
      grade: body.grade,
      repeat: body.repeat ?? "일회성",
      injury: body.injury ?? "없음",
      victimCount: body.victimCount ?? "1명",
      narrative: body.narrative,
    });

    // 2. 판례 검색 (4단계 확장 + 사건명 prefilter)
    console.log("[analyze] step2 search-precedents", kw);
    const search = await searchPrecedentsWithFallback(
      kw.statute,
      kw.action,
      kw.context,
    );
    console.log("[analyze] step2 done — stage", search.stage, "hits", search.hits.length);

    // 검색 0건
    if (search.hits.length === 0) {
      const empty: AnalysisReport = {
        sessionId,
        oneLineSummary: kw.oneLineSummary,
        headline: "유사한 판례를 찾지 못했습니다",
        totalFound: 0,
        stats: { notGuilty: 0, guilty: 0, other: 0 },
        precedents: [],
        protectiveFactors: [],
        riskFactors: [],
        flowSummary:
          "이 사안과 직접 비교할 만한 판례를 법제처 데이터베이스에서 찾지 못했습니다. 변호사나 교원단체(전국 1395, 교총·전교조 지부)에 상담하시는 것을 권합니다.",
        riskFlag: risk.flag,
        riskReasons: risk.reasons,
        generatedAt,
      };
      return NextResponse.json(empty);
    }

    // 3. 본문 조회 + 분석 (병렬, 최대 7건)
    console.log("[analyze] step3 analyze precedents, n=", Math.min(search.hits.length, MAX_PRECEDENTS));
    const targets = search.hits.slice(0, MAX_PRECEDENTS);
    const results = await Promise.all(
      targets.map(async (hit): Promise<PrecedentAnalysis | null> => {
        try {
          const detail = await getPrecedentDetail(hit.판례일련번호);
          const bodyText = extractRelevantBody(detail);
          if (!bodyText) return null;

          const raw = await analyzePrecedent({
            userSummary: kw.oneLineSummary,
            body: bodyText,
          });
          const verified = verifyQuotes(raw, bodyText);

          return {
            id: hit.판례일련번호,
            caseName: hit.사건명,
            caseNumber: hit.사건번호,
            court: hit.법원명,
            decidedAt: hit.선고일자,
            similarity: verified.similarity,
            similarityQuote: verified.similarityQuote ?? "",
            outcome: verified.outcome,
            outcomeQuote: verified.outcomeQuote ?? "",
            keyReasoning: verified.keyReasoning.map((r) => ({
              ...r,
              quote: r.quote ?? "",
            })),
            facts: verified.facts,
            differences: verified.differences,
            insight: verified.insight,
          };
        } catch (err) {
          console.error(
            "[analyze precedent]",
            hit.판례일련번호,
            err,
          );
          return null;
        }
      }),
    );

    const all = results
      .filter((r): r is PrecedentAnalysis => r !== null)
      .sort((a, b) => b.similarity - a.similarity);
    // 유사도 임계치 통과한 판례만 결과로. 통과한 게 0건이면 노이즈라도 보여줘
    // 사용자가 빈 화면 안 보게 한다.
    const aboveThreshold = all.filter((p) => p.similarity >= SIMILARITY_THRESHOLD);
    const precedents = aboveThreshold.length > 0 ? aboveThreshold : all;

    const stats = {
      notGuilty: precedents.filter(
        (p) =>
          p.outcome === "not_guilty" ||
          p.outcome === "guilty_overturned" ||
          p.outcome === "remand_for_acquittal",
      ).length,
      guilty: precedents.filter((p) => p.outcome === "guilty").length,
      other: precedents.filter((p) => p.outcome === "unclear").length,
    };

    // 4. 종합 분석
    console.log("[analyze] step4 summarize, precedents=", precedents.length);
    let summary;
    if (precedents.length > 0) {
      summary = await summarizeReport({
        userSummary: kw.oneLineSummary,
        precedents: precedents.map((p) => ({
          caseName: p.caseName,
          outcome: p.outcome,
          facts: p.facts,
          keyReasoning: p.keyReasoning,
          similarity: p.similarity,
        })),
        stats: { ...stats, total: precedents.length },
      });
    } else {
      summary = {
        headline: "분석 가능한 판례 본문이 부족합니다",
        flowSummary:
          "검색된 판례의 본문을 충분히 분석하지 못했습니다. 변호사 상담을 권합니다.",
        protectiveFactors: [],
        riskFactors: [],
      };
    }

    const report: AnalysisReport = {
      sessionId,
      oneLineSummary: kw.oneLineSummary,
      headline: summary.headline,
      totalFound: search.totalCnt,
      stats,
      precedents,
      protectiveFactors: summary.protectiveFactors,
      riskFactors: summary.riskFactors,
      flowSummary: summary.flowSummary,
      riskFlag: risk.flag,
      riskReasons: risk.reasons,
      generatedAt,
    };

    // 분석이 성공한 경우에만 사용량 기록 (실패 시 한도 소비 안 함).
    await recordUsage();

    return NextResponse.json(report);
  } catch (err) {
    console.error("[analyze]", err);
    const message =
      err instanceof Error ? err.message : "분석 중 알 수 없는 오류가 발생했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
