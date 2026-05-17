"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AnalysisReport, Outcome } from "@/types/analysis";
import { ReportLoadingView } from "@/components/ReportLoadingView";
import { PrintButton } from "@/components/PrintButton";
import { PrintHeader } from "@/components/PrintHeader";
import { ChatPanel } from "@/components/ChatPanel";

const outcomeLabel: Record<Outcome, string> = {
  not_guilty: "무죄",
  guilty: "유죄",
  guilty_overturned: "1심 유죄 → 항소심 무죄",
  remand_for_acquittal: "무죄 취지 파기환송",
  unclear: "결과 불명확",
};

const outcomeStyle: Record<Outcome, string> = {
  not_guilty: "bg-emerald-100 text-emerald-900",
  guilty: "bg-rose-100 text-rose-900",
  guilty_overturned: "bg-amber-100 text-amber-900",
  remand_for_acquittal: "bg-amber-100 text-amber-900",
  unclear: "bg-stone-200 text-stone-700",
};

interface UsageStatus {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  allowed: boolean;
  reason: "daily" | "monthly" | null;
  nextAvailableAt: number | null;
}

type FetchState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "limit"; usage: UsageStatus }
  | { status: "error"; message: string }
  | { status: "ready"; report: AnalysisReport };

export default function ReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [state, setState] = useState<FetchState>({ status: "loading" });
  // React 19 dev Strict Mode에서 useEffect가 두 번 실행되더라도
  // fetch와 sessionStorage 조작이 두 번 일어나지 않도록 first-run guard.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const cacheKey = `eduguard.report.${sessionId}`;
    const inputKey = `eduguard.input.${sessionId}`;

    // 1) 결과 캐시 우선 — 새로고침 시 재분석 비용 방지
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setState({ status: "ready", report: JSON.parse(cached) });
        return;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    // 2) 입력 확인
    const raw = sessionStorage.getItem(inputKey);
    if (!raw) {
      setState({ status: "missing" });
      return;
    }

    // 3) 입력 폐기는 응답 도착 후 (헌장: 분석 직후 즉시 폐기).
    (async () => {
      try {
        const input = JSON.parse(raw);
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, sessionId }),
        });
        if (res.status === 429) {
          const err = await res.json().catch(() => ({}));
          if (err.usage) {
            setState({ status: "limit", usage: err.usage as UsageStatus });
            return;
          }
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as AnalysisReport;
        sessionStorage.removeItem(inputKey);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        setState({ status: "ready", report: data });
      } catch (err) {
        sessionStorage.removeItem(inputKey);
        const message =
          err instanceof Error ? err.message : "분석 중 오류가 발생했습니다";
        setState({ status: "error", message });
      }
    })();
  }, [sessionId]);

  if (state.status === "loading") return <ReportLoadingView />;
  if (state.status === "missing") return <MissingInputView />;
  if (state.status === "limit") return <LimitExceededView usage={state.usage} />;
  if (state.status === "error") return <ErrorView message={state.message} />;

  return <ReportView report={state.report} />;
}

function LimitExceededView({ usage }: { usage: UsageStatus }) {
  const isDaily = usage.reason === "daily";
  const nextLabel = usage.nextAvailableAt
    ? new Date(usage.nextAvailableAt).toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-sm font-medium text-amber-700">사용량 한도 안내</p>
          <h1 className="text-xl font-semibold text-slate-900">
            {isDaily
              ? "오늘의 무료 분석 한도가 소진되었습니다"
              : "이번 달 무료 분석 한도가 소진되었습니다"}
          </h1>
        </header>

        <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
          <p>
            든든샘은 모두에게 무료로 제공됩니다. 비용 폭주 방지를 위해 일일·월간
            한도가 적용됩니다.
          </p>
          <p className="mt-2">
            {isDaily
              ? "24시간 후 다시 이용하실 수 있습니다."
              : "이번 달 한도는 30일 후 다시 회복됩니다."}
            {nextLabel && (
              <>
                {" "}
                다음 이용 가능: <strong>{nextLabel}</strong>
              </>
            )}
          </p>
        </section>

        <section className="rounded-md border border-stone-200 bg-white p-5 text-sm leading-relaxed text-stone-700">
          <p className="font-medium text-slate-900">긴급한 사안이라면</p>
          <p className="mt-2">
            아래 법률지원 채널을 바로 이용해주세요. 전국 1395 교권보호 직통전화는
            평일 09:00–18:00에 전문 상담을 제공합니다.
          </p>
          <Link
            href="/support"
            className="mt-3 inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
          >
            법률지원 채널 보기
          </Link>
        </section>

        <p className="text-center text-xs text-stone-500">
          현재 사용량 — 오늘 {usage.dailyUsed}/{usage.dailyLimit}회 · 이번 달{" "}
          {usage.monthlyUsed}/{usage.monthlyLimit}회
        </p>

        <div className="flex justify-center">
          <Link
            href="/"
            className="text-sm font-medium text-slate-700 underline decoration-stone-300 underline-offset-4 hover:text-slate-900"
          >
            처음으로
          </Link>
        </div>
      </div>
    </main>
  );
}

function MissingInputView() {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          분석 결과를 다시 표시할 수 없습니다
        </h1>
        <p className="text-sm leading-relaxed text-stone-600">
          입력하신 사안 내용은 분석 직후 즉시 폐기되므로, 페이지를 새로 여는 경우에는
          결과를 복원할 수 없습니다. 처음부터 다시 분석해주세요.
        </p>
        <div>
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
          >
            사안 입력 화면으로
          </Link>
        </div>
      </div>
    </main>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="text-xl font-semibold text-rose-900">
          분석 중 오류가 발생했습니다
        </h1>
        <p className="rounded-md border border-rose-200 bg-rose-50 p-4 text-left text-sm leading-relaxed text-rose-900">
          {message}
        </p>
        <p className="text-sm leading-relaxed text-stone-600">
          잠시 후 다시 시도해주세요. 반복되면 변호사·교원단체 상담을 권합니다.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
          >
            다시 입력하기
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-stone-300 px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-stone-100"
          >
            처음으로
          </Link>
        </div>
      </div>
    </main>
  );
}

function ReportView({ report }: { report: AnalysisReport }) {
  const isEmpty = report.precedents.length === 0;

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        <PrintHeader report={report} />

        {report.riskFlag && (report.riskReasons?.length ?? 0) > 0 && (
          <section className="overflow-hidden rounded-md border-l-4 border-amber-500 bg-amber-50 print:hidden">
            <div className="space-y-4 p-5 text-amber-900">
              <header className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  추가 검토 신호
                </p>
                <h2 className="text-base font-semibold leading-tight sm:text-lg">
                  선택하신 항목 중 즉시 검토가 필요한 신호가 있습니다
                </h2>
              </header>

              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {report.riskReasons.map((r) => (
                  <li
                    key={r}
                    className="rounded border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900"
                  >
                    {r}
                  </li>
                ))}
              </ul>

              <p className="text-sm leading-relaxed">
                위 판례 분석과는 별개로, 변호사 또는 교원단체와의 추가 상담을 함께
                고려하시기 바랍니다. 사실관계 정리는 시간이 지날수록 어려워지니
                되도록 빠르게 진행하시는 것이 좋습니다.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href="tel:1395"
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-amber-900 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-950"
                >
                  1395 교권보호 직통전화
                </a>
                <Link
                  href="/support"
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-amber-700 px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                >
                  법률지원 채널 보기
                </Link>
              </div>
            </div>
          </section>
        )}

        <header className="space-y-3">
          <p className="text-xs font-medium text-slate-600">분석 리포트</p>
          <h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
            {report.headline}
          </h1>
          <p className="text-sm text-stone-600">
            입력하신 사안:{" "}
            <span className="text-stone-800">{report.oneLineSummary}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
            <span>
              {new Date(report.generatedAt).toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              시점 법제처 데이터
            </span>
            <span aria-hidden>·</span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-900">
              실시간 조회 + 원문 검증
            </span>
          </div>

          {!isEmpty && (
            <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <PrintButton />
              <p className="text-xs leading-relaxed text-stone-500 sm:max-w-xs sm:text-right">
                변호사 상담·학교 내부 보고용입니다. 분쟁 상대방에게 직접 보내지 마세요.
              </p>
            </div>
          )}
        </header>


        {!isEmpty && (
          <section className="grid grid-cols-3 gap-3">
            <Stat label="유사 판례" value={report.precedents.length} unit="건" />
            <Stat
              label="무죄·무죄취지"
              value={report.stats.notGuilty}
              unit="건"
              highlight
            />
            <Stat label="유죄" value={report.stats.guilty} unit="건" />
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">법원의 판단 경향</h2>
          <p className="rounded-md border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-800">
            {report.flowSummary}
          </p>
        </section>

        {(report.protectiveFactors.length > 0 ||
          report.riskFactors.length > 0) && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {report.protectiveFactors.length > 0 && (
              <FactorList
                title="보호 요인"
                items={report.protectiveFactors}
                tone="emerald"
              />
            )}
            {report.riskFactors.length > 0 && (
              <FactorList
                title="위험 요인"
                items={report.riskFactors}
                tone="amber"
              />
            )}
          </section>
        )}

        {!isEmpty && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              유사 판례 {report.precedents.length}건
            </h2>
            <ul className="space-y-4">
              {report.precedents.map((p) => (
                <li
                  key={p.id}
                  className="space-y-4 rounded-md border border-stone-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900">
                        {p.caseName}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {p.court} · {p.caseNumber} · {p.decidedAt}
                      </p>
                    </div>
                    <span
                      className={`flex-none rounded-full px-2.5 py-1 text-xs font-medium ${outcomeStyle[p.outcome]}`}
                    >
                      {outcomeLabel[p.outcome]}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-stone-500">사용자 사안과의 유사도</p>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="h-1.5 flex-1 rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${p.similarity}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-stone-700">
                        {p.similarity}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-600">사실관계</p>
                    <p className="mt-1 text-sm leading-relaxed text-stone-800">
                      {p.facts}
                    </p>
                  </div>

                  {p.keyReasoning.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600">
                        법원의 판단 사유
                      </p>
                      <ul className="space-y-2">
                        {p.keyReasoning.map((r, idx) => (
                          <li
                            key={idx}
                            className="rounded border border-stone-100 bg-stone-50 p-3 text-sm leading-relaxed"
                          >
                            <p className="font-medium text-stone-900">{r.label}</p>
                            <p className="mt-0.5 text-stone-700">{r.explanation}</p>
                            {r.quote && (
                              <p className="mt-1.5 border-l-2 border-stone-300 pl-2 text-xs italic text-stone-600">
                                &ldquo;{r.quote}&rdquo;
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-slate-600">시사점</p>
                    <p className="mt-1 text-sm leading-relaxed text-stone-800">
                      {p.insight}
                    </p>
                  </div>

                  {p.differences.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600">
                        사용자 사안과의 차이
                      </p>
                      <ul className="mt-1 space-y-0.5 text-xs leading-relaxed text-stone-600">
                        {p.differences.map((d, idx) => (
                          <li key={idx}>· {d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="border-t border-stone-100 pt-3 print:hidden">
                    <Link
                      href={`/precedent/${p.id}`}
                      className="inline-flex items-center text-xs font-medium text-slate-700 underline decoration-stone-300 underline-offset-2 hover:text-slate-900"
                    >
                      판결문 원문 보기 →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-md border border-stone-200 bg-stone-100 p-4 text-sm leading-relaxed text-stone-700">
          <p className="text-xs font-medium text-slate-600">다음에 할 수 있는 일</p>
          <ul className="mt-2 space-y-1.5">
            <li>· 사실관계를 시간순으로 정리해두세요</li>
            <li>· 학교 관리자·교원단체에 즉시 알리세요</li>
            <li>
              ·{" "}
              <Link
                href="/support"
                className="font-medium text-slate-900 underline decoration-stone-400 underline-offset-2 hover:decoration-slate-900"
              >
                변호사·교원단체 상담 채널 보기
              </Link>{" "}
              — 1395, 교총·전교조 지부 등
            </li>
          </ul>
        </section>

        <ChatPanel report={report} />

        <div className="flex justify-center pt-4 print:hidden">
          <Link
            href="/"
            className="text-sm font-medium text-slate-700 underline decoration-stone-300 underline-offset-4 hover:text-slate-900"
          >
            처음으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${
        highlight
          ? "border-emerald-200 bg-emerald-50"
          : "border-stone-200 bg-white"
      }`}
    >
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-900">
        {value}
        <span className="ml-0.5 text-sm font-normal text-stone-500">{unit}</span>
      </p>
    </div>
  );
}

function FactorList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "amber";
}) {
  const toneCls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50"
      : "border-amber-200 bg-amber-50";
  return (
    <div className={`rounded-md border p-4 ${toneCls}`}>
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm leading-relaxed text-stone-700">
        {items.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}
