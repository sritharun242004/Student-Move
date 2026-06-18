import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "studentmoves.co.uk" },
      { protocol: "http", hostname: "gateway.studentmoves.co.uk" },
      { protocol: "https", hostname: "gateway.studentmoves.co.uk" },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/media/:path*`,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
