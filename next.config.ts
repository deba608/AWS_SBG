import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native canvas binding can't be bundled — load at runtime instead.
  serverExternalPackages: ["@napi-rs/canvas"],
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/events/aws-student-community-day-suiit-2026",
        destination: "/events/awsscd26",
        permanent: true,
      },
      // Canonical host: fold apex + stale vercel URL into www. Prevents duplicate indexing.
      {
        source: "/:path*",
        has: [{ type: "host", value: "awssbgsuiit.in" }],
        destination: "https://www.awssbgsuiit.in/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "ipo-desk.vercel.app" }],
        destination: "https://www.awssbgsuiit.in/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
