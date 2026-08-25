import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    // AVIF first (smaller than WebP); optimizer falls back per-browser support
    formats: ["image/avif", "image/webp"],
    // TMDB posters are immutable once published; cache optimized output a week
    minimumCacheTTL: 604800,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
    // placehold.co serves SVG placeholders; SVG is blocked by default in the
    // image optimizer as an XSS precaution. Mitigate with a strict CSP for
    // optimized images and force downloads instead of inline rendering.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    const production = process.env.NODE_ENV === "production";
    return [
      {
        source: "/(.*)",
        headers: [
          // Content-Security-Policy đã chuyển sang middleware (nonce-based,
          // xem src/lib/csp.ts) vì nonce là giá trị theo từng request — không
          // thể khai báo tĩnh ở đây. KHÔNG đặt thêm CSP ở đây: hai header CSP
          // sẽ bị trình duyệt giao hoán và làm vô hiệu nonce.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          ...(production
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
