import type { Metadata } from "next";
import Link from "next/link";
import { getPrecedentDetail } from "@/lib/lawApi";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "판례 원문 — 든든샘",
  description:
    "법제처 OPEN API에서 가져온 판례 원문(판시사항·판결요지·주문) 표시.",
};

function stripHtml(s: unknown): string {
  if (typeof s !== "string") return "";
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function formatDate(raw: string): string {
  // 법제처는 YYYYMMDD 형식인 경우가 있음. 사람이 읽기 좋게 변환.
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
  }
  return raw;
}

export default async function PrecedentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const oc = process.env.LAW_API_OC ?? "eduguard";
  const officialUrl = `http://www.law.go.kr/DRF/lawService.do?OC=${oc}&target=prec&type=HTML&ID=${id}&mobileYn=`;

  let detail;
  try {
    detail = await getPrecedentDetail(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return <ErrorView message={message} officialUrl={officialUrl} />;
  }

  if (!detail || Object.keys(detail).length === 0) {
    return <NotFoundView officialUrl={officialUrl} />;
  }

  const 사건명 = stripHtml(detail.사건명);
  const 사건번호 = stripHtml(detail.사건번호);
  const 법원명 = stripHtml(detail.법원명);
  const 선고일자 = formatDate(stripHtml(detail.선고일자));
  const 판시사항 = stripHtml(detail.판시사항);
  const 판결요지 = stripHtml(detail.판결요지);
  const 주문 = stripHtml(detail.주문);

  const meta = [법원명, 사건번호, 선고일자].filter(Boolean).join(" · ");

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-medium text-slate-600">판례 원문</p>
          <h1 className="text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
            {사건명 || "사건명 미상"}
          </h1>
          {meta && <p className="text-sm text-stone-600">{meta}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-900">
              법제처 공식 원문
            </span>
            <span className="rounded bg-stone-100 px-2 py-0.5 text-stone-700">
              판례일련번호 {id}
            </span>
          </div>
        </header>

        <section className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          이 페이지는 법제처 OPEN API에서 가져온 <strong>판례 원문 일부</strong>
          입니다. 든든샘은 이 본문을 분석에 사용합니다. 사용자 개별 사안에 대한
          법률적 판단·자문은 제공하지 않습니다.
        </section>

        {판시사항 && (
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">판시사항</h2>
            <p className="whitespace-pre-line rounded-md border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-800">
              {판시사항}
            </p>
          </section>
        )}

        {판결요지 && (
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">판결요지</h2>
            <p className="whitespace-pre-line rounded-md border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-800">
              {판결요지}
            </p>
          </section>
        )}

        {주문 && (
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">주문</h2>
            <p className="whitespace-pre-line rounded-md border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-800">
              {주문}
            </p>
          </section>
        )}

        <section className="rounded-md border border-stone-200 bg-stone-100 p-4 text-sm leading-relaxed text-stone-700">
          <p className="font-medium text-slate-900">법제처에서 전체 원문 보기</p>
          <p className="mt-1 text-stone-600">
            위는 분석에 사용된 핵심 부분(판시사항·판결요지·주문)입니다. 사건의
            전체 본문(사실관계·증거 분석·이유 등)은 법제처 사이트에서 확인하실 수
            있습니다.
          </p>
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
          >
            법제처 원문 열기
          </a>
        </section>

        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/"
            className="text-sm font-medium text-slate-700 underline decoration-stone-300 underline-offset-4 hover:text-slate-900"
          >
            처음으로
          </Link>
          <Link
            href="/analyze"
            className="text-sm font-medium text-slate-700 underline decoration-stone-300 underline-offset-4 hover:text-slate-900"
          >
            새 사안 분석하기
          </Link>
        </div>
      </div>
    </main>
  );
}

function NotFoundView({ officialUrl }: { officialUrl: string }) {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          판례 본문을 찾을 수 없습니다
        </h1>
        <p className="text-sm leading-relaxed text-stone-600">
          이 판례의 본문이 법제처 OPEN API에서 제공되지 않을 수 있습니다. 법제처
          사이트에서 직접 확인해주세요.
        </p>
        <div>
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
          >
            법제처에서 시도
          </a>
        </div>
        <div>
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

function ErrorView({
  message,
  officialUrl,
}: {
  message: string;
  officialUrl: string;
}) {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="text-xl font-semibold text-rose-900">
          판례 본문 조회에 실패했습니다
        </h1>
        <p className="rounded-md border border-rose-200 bg-rose-50 p-4 text-left text-sm leading-relaxed text-rose-900">
          {message}
        </p>
        <div>
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
          >
            법제처에서 시도
          </a>
        </div>
        <div>
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
