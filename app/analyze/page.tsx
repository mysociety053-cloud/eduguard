"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  actionOptions,
  situationOptions,
  gradeOptions,
  repeatOptions,
  injuryOptions,
  victimCountOptions,
  type RepeatValue,
  type InjuryValue,
  type VictimCountValue,
} from "@/data/checklistOptions";

export default function AnalyzePage() {
  const router = useRouter();
  const [actions, setActions] = useState<string[]>([]);
  const [situation, setSituation] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [repeat, setRepeat] = useState<RepeatValue>("일회성");
  const [injury, setInjury] = useState<InjuryValue>("없음");
  const [victimCount, setVictimCount] = useState<VictimCountValue>("1명");
  const [narrative, setNarrative] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [usage, setUsage] = useState<{
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
    allowed: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUsage(data))
      .catch(() => {});
  }, []);

  const toggleAction = (value: string) => {
    setActions((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const isValid = actions.length > 0 && situation !== "" && grade !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    // sessionStorage로 입력 전달. 리포트 페이지가 mount 시 읽어 즉시 폐기.
    sessionStorage.setItem(
      `eduguard.input.${sessionId}`,
      JSON.stringify({
        actions,
        situation,
        grade,
        repeat,
        injury,
        victimCount,
        narrative,
      }),
    );
    router.push(`/report/${sessionId}`);
    // 안전망: router.push가 빨리 끝나지 않거나 사용자가 뒤로 돌아오는 경우를 대비해 reset.
    setTimeout(() => setSubmitting(false), 3000);
  };

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        <header className="space-y-2">
          <p className="text-sm font-medium text-slate-600">사안 입력</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            어떤 상황인지 짧게 알려주세요
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            체크리스트로 빠르게 채우고, 필요하면 아래에 덧붙여 주세요. 비슷한 판례와
            대응 방향까지 정리해드릴게요. 입력 내용은 분석 직후 폐기됩니다.
          </p>
          {usage && (
            <p className="text-xs text-stone-500">
              오늘 사용 {usage.dailyUsed}/{usage.dailyLimit}회 · 이번 달{" "}
              {usage.monthlyUsed}/{usage.monthlyLimit}회 (모두에게 무료 제공을
              위한 한도)
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <fieldset className="space-y-3">
            <legend className="text-base font-medium text-slate-900">
              어떤 행위가 문제되었나요?{" "}
              <span className="text-sm font-normal text-stone-500">
                (여러 개 선택 가능)
              </span>
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {actionOptions.map((opt) => {
                const checked = actions.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition ${
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAction(opt.value)}
                      className="mt-1 accent-slate-900"
                    />
                    <span className="flex-1">
                      <span className="block font-medium text-stone-900">
                        {opt.label}
                      </span>
                      {opt.description && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">
                          {opt.description}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-base font-medium text-slate-900">
              언제 발생했나요?
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {situationOptions.map((opt) => {
                const checked = situation === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition ${
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="situation"
                      value={opt.value}
                      checked={checked}
                      onChange={(e) => setSituation(e.target.value)}
                      className="accent-slate-900"
                    />
                    <span className="font-medium text-stone-900">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-base font-medium text-slate-900">학생 학년</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gradeOptions.map((opt) => {
                const checked = grade === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition ${
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="grade"
                      value={opt.value}
                      checked={checked}
                      onChange={(e) => setGrade(e.target.value)}
                      className="accent-slate-900"
                    />
                    <span className="font-medium text-stone-900">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-base font-medium text-slate-900">
              반복성{" "}
              <span className="text-sm font-normal text-stone-500">
                (위험 신호 자체 체크용)
              </span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {repeatOptions.map((opt) => {
                const checked = repeat === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition ${
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="repeat"
                      value={opt.value}
                      checked={checked}
                      onChange={(e) => setRepeat(e.target.value as RepeatValue)}
                      className="mt-1 accent-slate-900"
                    />
                    <span className="flex-1">
                      <span className="block font-medium text-stone-900">
                        {opt.label}
                      </span>
                      {opt.description && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">
                          {opt.description}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-base font-medium text-slate-900">
              신체적 피해 정도
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {injuryOptions.map((opt) => {
                const checked = injury === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm transition ${
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="injury"
                      value={opt.value}
                      checked={checked}
                      onChange={(e) => setInjury(e.target.value as InjuryValue)}
                      className="mt-1 accent-slate-900"
                    />
                    <span className="flex-1">
                      <span className="block font-medium text-stone-900">
                        {opt.label}
                      </span>
                      {opt.description && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">
                          {opt.description}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-base font-medium text-slate-900">
              관련 학생 수
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {victimCountOptions.map((opt) => {
                const checked = victimCount === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition ${
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="victimCount"
                      value={opt.value}
                      checked={checked}
                      onChange={(e) =>
                        setVictimCount(e.target.value as VictimCountValue)
                      }
                      className="accent-slate-900"
                    />
                    <span className="font-medium text-stone-900">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <label htmlFor="narrative" className="block">
              <span className="text-base font-medium text-slate-900">
                자유 서술{" "}
                <span className="text-sm font-normal text-stone-500">(선택)</span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-stone-500">
                체크박스로 표현하기 어려운 정황을 적어주세요. 학교명·지역명·실명은 적지
                마세요.
              </span>
            </label>
            <textarea
              id="narrative"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={6}
              maxLength={1000}
              placeholder="예: 수업 중 떠드는 학생을 한 차례 복도로 분리시켰는데..."
              className="w-full resize-none rounded-md border border-stone-200 bg-white p-3 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-slate-900 focus:outline-none"
            />
            <p className="text-right text-xs text-stone-500">
              {narrative.length} / 1000
            </p>
          </fieldset>

          <div className="flex flex-col-reverse items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-stone-500">
              {isValid ? (
                "분석 준비 완료"
              ) : (
                <>
                  필수: 행위 {actions.length > 0 ? "✓" : "✗"} · 시점{" "}
                  {situation ? "✓" : "✗"} · 학년 {grade ? "✓" : "✗"}
                </>
              )}
            </p>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="rounded-md bg-slate-900 px-6 py-3 text-base font-medium text-stone-50 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {submitting ? "분석 시작 중…" : "분석 시작"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
