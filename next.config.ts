import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // N'annonce pas « X-Powered-By: Next.js » dans les réponses HTTP.
  poweredByHeader: false,
  // Photo de jaquette (US-12) : réduite dans le navigateur à 1600 px (≈ 0,5 Mo), marge sous la limite de Vercel.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
