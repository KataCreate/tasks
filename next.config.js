/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // パフォーマンス最適化
  compress: true,
  poweredByHeader: false,

  // 画像最適化
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 86400,
  },

  // 実験的機能でパフォーマンス向上
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "lucide-react"],
  },

  // バンドル分析（開発時のみ）
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 開発時のパフォーマンス向上
      config.devtool = "eval-cheap-module-source-map";
    }

    return config;
  },

  // ヘッダー設定でキャッシュ最適化
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
