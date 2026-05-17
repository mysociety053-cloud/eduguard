"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded-md border border-slate-900 px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-900 hover:text-stone-50 print:hidden"
    >
      PDF로 저장 · 인쇄
    </button>
  );
}
