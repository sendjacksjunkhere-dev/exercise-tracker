import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    if (process.env.NODE_ENV === "production") {
      return [];
    }

    // Mobile Safari aggressively caches pages; disable caching in dev so
    // phone testing always sees the latest changes without manual cache-clearing.
    return [
      {
        source: "/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
