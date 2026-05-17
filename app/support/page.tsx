import type { Metadata } from "next";
import Link from "next/link";
import { NATIONAL_CHANNELS, type LegalChannel } from "@/data/legalChannels";

export const metadata: Metadata = {
  title: "법률지원 채널 — 든든샘",
  description:
    "교사를 위한 교권·법률 상담 채널 안내. 1395 교권보호 직통전화, 교원단체, 시도교육청 교권보호위원회 등.",
};

export default function SupportPage() {
  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        <header className="space-y-3">
          <p className="text-xs font-medium text-slate-600">법률지원 채널</p>
          <h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
            전문가 상담으로 연결합니다
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            든든샘은 판례 정보 제공 도구이며, 구체적 법률 판단은 변호사·교원단체와의
            직접 상담이 필요합니다. 우선 안내가 빠른 채널을 모았습니다.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">전국 채널</h2>
          <ul className="space-y-4">
            {NATIONAL_CHANNELS.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-stone-200 bg-stone-100 p-4 text-sm leading-relaxed text-stone-700">
          <p className="text-xs font-medium text-slate-600">지역 채널 보강 예정</p>
          <p className="mt-2">
            16개 시도 교사노조 지부, 전교조 지부, 시도교육청 교권보호위원회의 개별
            연락처는 Phase 2에서 보강할 예정입니다. 지금은 위 본부 채널을 통해 지역
            지부 정보를 안내받으실 수 있습니다.
          </p>
        </section>

        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <p className="font-medium">정보 정확성 안내</p>
          <p className="mt-1">
            각 항목의 마지막 확인일을 표시했습니다. 운영시간·연락처는 변경될 수
            있으니 통화·방문 전 공식 사이트에서 한 번 더 확인하시기 바랍니다.
          </p>
        </section>

        <div className="flex justify-center pt-4">
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

function ChannelCard({ channel: c }: { channel: LegalChannel }) {
  return (
    <li className="space-y-3 rounded-md border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-stone-900">{c.name}</p>
        {c.fee && <span className="text-xs text-stone-500">{c.fee}</span>}
      </div>

      <p className="text-sm leading-relaxed text-stone-700">{c.description}</p>

      {c.phone && (
        <a
          href={`tel:${c.phone}`}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-slate-800"
        >
          {c.phone} 전화 걸기
        </a>
      )}

      {c.website && (
        <a
          href={c.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md border border-slate-900 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-900 hover:text-stone-50"
        >
          공식 사이트 열기
        </a>
      )}

      <dl className="space-y-1 text-xs text-stone-500">
        {c.hours && (
          <div className="flex gap-2">
            <dt className="w-20 flex-none">운영</dt>
            <dd className="text-stone-700">{c.hours}</dd>
          </div>
        )}
        {c.searchHint && (
          <div className="flex gap-2">
            <dt className="w-20 flex-none">검색 키워드</dt>
            <dd className="text-stone-700">{c.searchHint}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="w-20 flex-none">확인일</dt>
          <dd>{c.lastVerifiedAt}</dd>
        </div>
      </dl>
    </li>
  );
}
