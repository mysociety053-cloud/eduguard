"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisReport } from "@/types/analysis";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_INPUT = 500;
const MAX_MESSAGES = 30;

export function ChatPanel({ report }: { report: AnalysisReport }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const send = async () => {
    const userMessage = input.trim();
    if (!userMessage || loading) return;

    setInput("");
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(next);
    setLoading(true);

    try {
      const reportContext = {
        oneLineSummary: report.oneLineSummary,
        headline: report.headline,
        flowSummary: report.flowSummary,
        protectiveFactors: report.protectiveFactors,
        riskFactors: report.riskFactors,
        precedents: report.precedents.map((p) => ({
          caseName: p.caseName,
          caseNumber: p.caseNumber,
          court: p.court,
          outcome: p.outcome,
          similarity: p.similarity,
          facts: p.facts,
          insight: p.insight,
        })),
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportContext,
          history: messages,
          userMessage,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { reply: string };
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "채팅 중 오류");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const reachedLimit = messages.length >= MAX_MESSAGES;

  return (
    <section className="rounded-md border border-stone-200 bg-white p-5 print:hidden">
      <header className="mb-3 space-y-1">
        <h2 className="text-base font-semibold text-slate-900">
          분석 결과에 대해 물어보기
        </h2>
        <p className="text-xs leading-relaxed text-stone-500">
          판례·법리·대응 방안을 더 자세히 알고 싶으시면 질문해주세요. 법률 자문이
          아닌 정보 제공이며, 구체적 법률 판단은 변호사와 상담하시기 바랍니다.
        </p>
      </header>

      {messages.length === 0 && (
        <div className="mb-3 space-y-1 rounded-md border border-stone-100 bg-stone-50 p-3 text-xs leading-relaxed text-stone-600">
          <p className="font-medium text-stone-700">예시 질문</p>
          <ul className="space-y-0.5">
            <li>· "사회상규가 무슨 의미인가요?"</li>
            <li>· "변호사 상담 시 어떤 자료를 챙겨야 하나요?"</li>
            <li>· "1심 유죄, 항소심 무죄가 된 사례를 더 자세히 설명해주세요"</li>
            <li>· "이 분석에서 가장 주의해야 할 점은 무엇인가요?"</li>
          </ul>
        </div>
      )}

      {messages.length > 0 && (
        <ol className="mb-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <li
              key={i}
              className={`whitespace-pre-line rounded-md px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto max-w-[80%] bg-slate-900 text-stone-50"
                  : "mr-auto max-w-[90%] border border-stone-200 bg-stone-50 text-stone-800"
              }`}
            >
              {m.content}
            </li>
          ))}
          {loading && (
            <li className="mr-auto max-w-[90%] rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500">
              답변 작성 중…
            </li>
          )}
          <div ref={endRef} />
        </ol>
      )}

      {error && (
        <p className="mb-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs leading-relaxed text-rose-900">
          {error}
        </p>
      )}

      {reachedLimit ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          이 분석 세션의 채팅 한도(30회)에 도달했습니다. 추가 질의는 변호사·교원단체에
          문의해주세요.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="궁금한 점을 질문해주세요"
            maxLength={MAX_INPUT}
            rows={2}
            className="w-full resize-none rounded-md border border-stone-200 bg-white p-2 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-slate-900 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-stone-500">
              {input.length} / {MAX_INPUT} · Enter 전송 · Shift+Enter 줄바꿈
            </p>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {loading ? "전송 중…" : "전송"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
