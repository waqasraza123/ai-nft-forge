import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@ai-nft-forge/contracts",
    "@ai-nft-forge/database",
    "@ai-nft-forge/shared",
    "@ai-nft-forge/ui"
  ]
};

export default nextConfig;
