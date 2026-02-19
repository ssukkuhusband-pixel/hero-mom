import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/hero-mom",
  assetPrefix: "/hero-mom/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
