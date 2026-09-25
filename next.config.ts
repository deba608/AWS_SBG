import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native canvas binding can't be bundled — load at runtime instead.
  serverExternalPackages: ["@napi-rs/canvas"],
};

export default nextConfig;
