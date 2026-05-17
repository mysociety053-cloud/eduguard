import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict Mode는 useEffect를 dev에서 두 번 실행한다. 우리 리포트 페이지는
  // 30~60초짜리 단발 fetch + 결과 캐싱 패턴이라, Strict Mode가
  // 1차 cleanup으로 setState 차단 → 2차 mount 새 fetch 안 시작 → 로딩 영원
  // 부작용을 일으킨다. 프로덕션 동작과 무관하므로 dev에서 끈다.
  reactStrictMode: false,
  // 로컬 네트워크 IP로 접근 시 HMR·폰트가 cross-origin으로 차단되는 문제 해결.
  // (Next.js 16 dev 기본 보안 정책)
  allowedDevOrigins: ["192.168.45.98", "localhost", "127.0.0.1"],
};

export default nextConfig;
