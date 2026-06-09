import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Jersey images can be hosted anywhere (Supabase Storage or any image host),
    // so allow any HTTPS source. Tighten this if images are centralized later.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
