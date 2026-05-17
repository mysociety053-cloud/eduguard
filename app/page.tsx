import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-medium tracking-wide text-slate-600">
            든든샘 · EduGuard
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            교사 곁에서, 판례를 함께 찾아드립니다
          </h1>
          <p className="text-base leading-relaxed text-stone-700">
            신고를 받았든, 내 지도가 법의 테두리 안인지 미리 알고 싶든 — 법원의 판단
            경향을 일상 언어로 풀어드립니다. 변호사는 아니지만, 사실관계·판례 정리와
            대응 방향까지 함께 짚어드립니다.
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <li className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-600">무료</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-700">
              모든 사용자에게 무료. 가입 없이 사용.
            </p>
          </li>
          <li className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-600">익명</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-700">
              사안 내용은 분석 직후 폐기됩니다.
            </p>
          </li>
          <li className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-600">실시간 검증</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-700">
              법제처 공식 API · 원문 인용 검증.
            </p>
          </li>
        </ul>

        <section className="rounded-md border-2 border-slate-900 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-900">
            검증된 신뢰
          </p>
          <h2 className="mt-2 text-base font-semibold text-stone-900">
            AI가 만들어내는 가짜 판례 인용, 든든샘은 다릅니다
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            다른 AI 도구에 같은 사안을 물어보면 <strong>존재하지 않는 사건번호</strong>나{" "}
            <strong>가공된 본문 인용</strong>을 그럴듯하게 만들어내는 경우가 흔합니다
            (자체 검증 결과 인용 판례의 약 75%가 환각). 든든샘은{" "}
            <strong>법제처 OPEN API에서 매번 실시간으로 최신 대법원·고등법원 판례를
            조회</strong>하고, LLM이 인용한 본문 문장은 원문 매칭으로 검증된 것만
            화면에 표시합니다.
          </p>
        </section>

        <div className="space-y-4">
          <div>
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-6 py-3 text-base font-medium text-stone-50 transition hover:bg-slate-800"
            >
              내 사안 분석 시작하기
            </Link>
            <p className="mt-3 text-xs text-stone-500">약 3분 소요</p>
          </div>
          <p className="text-sm text-stone-600">
            이미 신고를 받아 긴급하시다면 →{" "}
            <Link
              href="/support"
              className="font-medium text-slate-900 underline decoration-stone-400 underline-offset-2 hover:decoration-slate-900"
            >
              법률지원 채널 바로 보기
            </Link>
          </p>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <p className="font-medium">법률 자문이 아닙니다</p>
          <p className="mt-1">
            제공되는 분석은 법원의 과거 판단 경향을 보여주는 자료이며, 구체적 법률
            판단은 변호사와 상의하시기 바랍니다.
          </p>
        </div>
      </div>
    </main>
  );
}
