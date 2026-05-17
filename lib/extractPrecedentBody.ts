import type { PrecedentDetail } from "./lawApi";

const stripHtml = (s: unknown): string => {
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
};

/**
 * 판례 본문에서 분석에 핵심적인 부분만 추출.
 * 헌장 §5: 본문 전체(판례내용) 대신 판시사항+판결요지+주문만 사용해
 * 토큰 80~90% 절감, 정확도는 동일 (실증 검증됨).
 */
export function extractRelevantBody(detail: PrecedentDetail): string {
  const parts: string[] = [];

  const jisi = stripHtml(detail.판시사항);
  const yoji = stripHtml(detail.판결요지);
  const jumon = stripHtml(detail.주문);

  if (jisi) parts.push(`[판시사항]\n${jisi}`);
  if (yoji) parts.push(`[판결요지]\n${yoji}`);
  if (jumon) parts.push(`[주문]\n${jumon}`);

  // 셋 다 비어있을 때만 판례내용 발췌(최후 폴백).
  if (parts.length === 0) {
    const content = stripHtml(detail.판례내용);
    if (content) parts.push(`[판례내용 발췌]\n${content.slice(0, 2500)}`);
  }

  return parts.join("\n\n");
}
