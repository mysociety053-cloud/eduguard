import type { Metadata } from "next";
import "./globals.css";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";

export const metadata: Metadata = {
  title: "든든샘 — 교사를 위한 무료 판례 탐색 도구",
  description:
    "신고에 직면한 교사부터 자신의 지도행위가 법의 테두리 안에 있는지 미리 확인하고 싶은 교사까지, 법원이 비슷한 사안을 어떻게 판단해왔는지 일상 언어로 풀어드리는 무료 판례 정보 도구입니다. 법률 자문이 아닌 판례 정보 제공 서비스입니다.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        {children}
        <DisclaimerBanner />
      </body>
    </html>
  );
}
