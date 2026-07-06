import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Product images can come from any merchant site
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    localPatterns: [{ pathname: "/api/uploads/**" }],
  },
};

export default nextConfig;
