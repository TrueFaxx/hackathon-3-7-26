import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/auth/:path*", destination: `${backend}/auth/:path*` },
      { source: "/health", destination: `${backend}/health` },
      { source: "/webhook", destination: `${backend}/webhook` },
    ];
  },
};

export default nextConfig;
