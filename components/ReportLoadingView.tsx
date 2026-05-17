export function ReportLoadingView() {
  const steps = [
    { label: "키워드 추출", description: "사안을 법률 검색어로 변환합니다" },
    { label: "판례 검색", description: "법제처 데이터베이스를 조회합니다" },
    { label: "유사도 분석", description: "각 판례를 사안과 비교합니다" },
    { label: "리포트 정리", description: "결과를 보기 좋게 정리합니다" },
  ];

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-xl space-y-10">
        <header className="space-y-2 text-center">
          <p className="text-sm font-medium text-slate-600">분석 중</p>
          <h1 className="text-xl font-semibold text-slate-900">
            비슷한 판례를 함께 찾고 있어요
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            판단 경향과 대응 방향까지 정리해드릴게요. 보통 30초~1분 정도 걸립니다.
          </p>
        </header>

        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li
              key={step.label}
              className="flex animate-pulse items-start gap-3 rounded-md border border-stone-200 bg-white p-3"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-stone-50">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-900">{step.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
          <p className="text-xs font-medium text-emerald-800">검증된 출처</p>
          <p className="mt-2">
            법제처 OPEN API에서 최신 판례를{" "}
            <strong className="font-semibold">실시간으로 조회</strong>하고 있습니다.
            다른 AI가 만들어낸 가짜 판례 인용은 표시되지 않습니다.
          </p>
        </aside>

        <aside className="rounded-md border border-stone-200 bg-stone-100 p-4 text-sm leading-relaxed text-stone-700">
          <p className="text-xs font-medium text-slate-600">알아두세요</p>
          <p className="mt-2">
            법원은 교사의 행위를 평가할 때{" "}
            <strong className="font-semibold">일회성인지 반복적인지</strong>,
            <strong className="font-semibold"> 교육 목적이 있었는지</strong>,
            <strong className="font-semibold"> 합리적 범위 내였는지</strong>를 중요하게
            봅니다.
          </p>
        </aside>
      </div>
    </main>
  );
}
