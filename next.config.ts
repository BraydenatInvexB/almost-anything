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
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "**.cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "**.wp.com",
      },
      // Supplier / discovery listing images (SA trade + B2B marketplaces)
      {
        protocol: "https",
        hostname: "**.co.za",
      },
      {
        protocol: "https",
        hostname: "**.made-in-china.com",
      },
      {
        protocol: "https",
        hostname: "**.1688.com",
      },
      {
        protocol: "https",
        hostname: "**.globalsources.com",
      },
      {
        protocol: "https",
        hostname: "**.dhgate.com",
      },
      {
        protocol: "https",
        hostname: "**.faithful-to-nature.co.za",
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
