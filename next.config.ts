import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "**.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "media.takealot.com",
      },
      {
        protocol: "https",
        hostname: "**.takealot.com",
      },
      {
        protocol: "https",
        hostname: "**.alicdn.com",
      },
      // OAuth provider avatars (Google / Facebook)
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
    ],
  },
};

export default nextConfig;
