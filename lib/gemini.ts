import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY 환경변수가 설정되지 않았습니다. .env.local을 확인해주세요.",
    );
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}

export const MODEL_FLASH = "gemini-2.5-flash";

const RETRIABLE_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "UND_ERR_SOCKET",
]);

/**
 * Gemini 호출 중 발생하는 일시적 네트워크 오류(ECONNRESET 등)를 재시도.
 * 비-재시도 오류(키 오류·정책 위반 등)는 즉시 throw.
 */
export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const cause = (err as { cause?: { code?: string } })?.cause;
      const code = cause?.code;
      const retriable = code !== undefined && RETRIABLE_CODES.has(code);
      if (!retriable || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}
