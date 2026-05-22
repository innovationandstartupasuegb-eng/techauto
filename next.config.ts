import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ավելացնում ենք այս հրամանը՝ ավտոմատ լոգինի էջ տանելու համար
  async redirects() {
    return [
      {
        source: '/',
        destination: '/sign/sign/login',
        permanent: true, // Սա ասում է բրաուզերին, որ վերահասցեավորումը մշտական է
      },
    ];
  },
};

export default nextConfig;