import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native canvas binding can't be bundled — load at runtime instead.
  serverExternalPackages: ["@napi-rs/canvas"],
  async redirects() {
    return [
      {
        source: "/events/aws-student-community-day-suiit-2026",
        destination: "/events/awsscd26",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
