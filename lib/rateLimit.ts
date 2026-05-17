import { cookies } from "next/headers";

// 헌장 §8 기본값.
export const DAILY_LIMIT = 3;
export const MONTHLY_LIMIT = 10;

const COOKIE_NAME = "eduguard_usage";
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

export interface UsageStatus {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  allowed: boolean;
  reason: "daily" | "monthly" | null;
  /** 다음 분석 가능 시점 (epoch ms). allowed=false일 때만 의미. */
  nextAvailableAt: number | null;
}

function parseUsage(raw: string | undefined): number[] {
  if (!raw) return [];
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const arr = JSON.parse(decoded);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function serializeUsage(timestamps: number[]): string {
  return Buffer.from(JSON.stringify(timestamps)).toString("base64");
}

function computeStatus(timestamps: number[]): UsageStatus {
  const now = Date.now();
  const dayAgo = now - DAY_MS;
  const monthAgo = now - MONTH_MS;
  const dailyTs = timestamps.filter((t) => t >= dayAgo);
  const monthlyTs = timestamps.filter((t) => t >= monthAgo);
  const dailyUsed = dailyTs.length;
  const monthlyUsed = monthlyTs.length;

  let allowed = true;
  let reason: UsageStatus["reason"] = null;
  let nextAvailableAt: number | null = null;

  if (dailyUsed >= DAILY_LIMIT) {
    allowed = false;
    reason = "daily";
    // 가장 오래된 일일 사용 + 24h = 다음 가능 시각
    nextAvailableAt = Math.min(...dailyTs) + DAY_MS;
  } else if (monthlyUsed >= MONTHLY_LIMIT) {
    allowed = false;
    reason = "monthly";
    nextAvailableAt = Math.min(...monthlyTs) + MONTH_MS;
  }

  return {
    dailyUsed,
    dailyLimit: DAILY_LIMIT,
    monthlyUsed,
    monthlyLimit: MONTHLY_LIMIT,
    allowed,
    reason,
    nextAvailableAt,
  };
}

export async function checkUsage(): Promise<UsageStatus> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  return computeStatus(parseUsage(raw));
}

/**
 * 분석 1건 사용을 기록. 30일 이전 항목은 정리.
 * checkUsage가 allowed=true일 때만 호출할 것.
 */
export async function recordUsage(): Promise<void> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  const ts = parseUsage(raw);
  const now = Date.now();
  const monthAgo = now - MONTH_MS;
  const updated = [...ts.filter((t) => t >= monthAgo), now];

  store.set(COOKIE_NAME, serializeUsage(updated), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 31 * 24 * 60 * 60, // 31일 (월 한도 + 여유)
    path: "/",
  });
}
