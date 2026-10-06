import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  ...(isVercel ? {} : { output: "standalone" }),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
