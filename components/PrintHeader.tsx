import type { AnalysisReport } from "@/types/analysis";

export function PrintHeader({ report }: { report: AnalysisReport }) {
  const generatedAt = new Date(report.generatedAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="hidden print:block mb-6 space-y-3 border-b border-stone-400 pb-4 text-xs leading-relaxed text-stone-900">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold">든든샘 EduGuard — 판례 정보 리포트</p>
        <p className="text-xs">
          세션 {report.sessionId.slice(0, 8)} · 생성 {generatedAt}
        </p>
      </div>
      <div className="rounded border border-stone-400 p-3">
        <p className="text-xs font-semibold">사용 안내</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
          <li>
            본 자료는 법률 자문이 아니며,{" "}
            <strong className="font-semibold">변호사 상담·학교 내부 검토용</strong>
            입니다.
          </li>
          <li>
            <strong className="font-semibold">
              분쟁 상대방(학부모 등)에게 직접 제시할 목적이 아닙니다.
            </strong>
          </li>
          <li>판단의 단정이 아닌 법원의 과거 판단 경향을 보여주는 자료입니다.</li>
          <li>
            모든 판례 인용은{" "}
            <strong className="font-semibold">
              법제처 OPEN API에서 실시간 조회
            </strong>
            되었으며, 본문 인용은 원문 매칭으로 검증되었습니다. (다른 AI 도구가
            만들어내는 가짜 판례 인용 문제 차단)
          </li>
          <li>입력하신 사안 본문은 분석 직후 폐기되었습니다.</li>
        </ul>
      </div>
    </div>
  );
}
