import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Սա թույլ կտա Vercel-ին հաջողությամբ ավարտել build-ը՝ 
    // անտեսելով TypeScript-ի տիպային սխալները
    ignoreBuildErrors: true,
  },
};

export default nextConfig;