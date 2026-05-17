import Link from "next/link";
import { APP_VERSION, ANALYSIS_ENGINE_UPDATED } from "@/lib/version";

export function DisclaimerBanner() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-stone-100 px-6 py-8 text-sm text-stone-600 print:hidden">
      <div className="mx-auto max-w-2xl space-y-4 leading-relaxed">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link
            href="/"
            className="font-medium text-slate-700 hover:text-slate-900"
          >
            홈
          </Link>
          <span aria-hidden className="text-stone-300">
            ·
          </span>
          <Link
            href="/analyze"
            className="font-medium text-slate-700 hover:text-slate-900"
          >
            사안 분석
          </Link>
          <span aria-hidden className="text-stone-300">
            ·
          </span>
          <Link
            href="/support"
            className="font-medium text-slate-700 hover:text-slate-900"
          >
            법률지원 채널
          </Link>
        </nav>

        <div className="space-y-2 border-t border-stone-200 pt-4">
          <p className="font-medium text-stone-700">
            든든샘은 법률 자문이 아닌 판례 정보 제공 서비스입니다.
          </p>
          <p>
            제공되는 분석은 법원이 과거에 어떻게 판단해왔는지의 경향을 보여주는 자료이며,
            개별 사안의 법적 책임이나 처분 결과를 단정하지 않습니다. 구체적 법률 판단은
            반드시 변호사와 상의하시기 바랍니다.
          </p>
          <p className="text-stone-500">
            입력하신 사안 내용은 분석 직후 즉시 폐기되며 저장되지 않습니다.
          </p>
          <p className="pt-2 text-xs leading-relaxed text-stone-500">
            데이터 출처: 법제처 OPEN API (실시간 조회) · 분석 엔진 v{APP_VERSION}{" "}
            ({ANALYSIS_ENGINE_UPDATED} 업데이트). 다른 AI 도구가 그럴듯하게
            만들어내는 가짜 판례 인용 문제를 피하기 위해, 든든샘은 모든 판례를
            법제처에서 매번 실시간으로 가져오며 본문 인용은 원문 매칭으로
            검증합니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
