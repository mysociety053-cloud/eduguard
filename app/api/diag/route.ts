import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 일시적 진단용. 원인 파악 후 제거 예정.
export async function GET() {
  const oc = process.env.LAW_API_OC ?? "(none)";

  // 1. 외부에서 본 우리 서버의 IP
  let outboundIp = "";
  try {
    const r = await fetch("https://ifconfig.me/ip", { cache: "no-store" });
    outboundIp = (await r.text()).trim();
  } catch (err) {
    outboundIp = `ERROR ${(err as Error).message}`;
  }

  // 2. 법제처 raw 응답
  const lawUrl = `http://www.law.go.kr/DRF/lawSearch.do?OC=${oc}&target=prec&type=JSON&query=%EC%95%84%EB%8F%99%ED%95%99%EB%8C%80&display=3`;
  let lawStatus = 0;
  let lawBody = "";
  try {
    const r = await fetch(lawUrl, { cache: "no-store" });
    lawStatus = r.status;
    lawBody = await r.text();
  } catch (err) {
    lawBody = `ERROR ${(err as Error).message}`;
  }

  return NextResponse.json({
    serverOutboundIp: outboundIp,
    lawApiOC: oc,
    lawApiStatus: lawStatus,
    lawApiBodyPreview: lawBody.slice(0, 800),
  });
}
