import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wcczvedassfquzdrmwko.supabase.co',
      },
    ],
  },
};

export default nextConfig;
