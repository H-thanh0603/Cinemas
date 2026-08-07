import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
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
    const csp = [
      "default-src 'self'",
      // Next.js App Router injects inline bootstrap/flight scripts
      // (self.__next_f) that MUST run for hydration. Until we migrate to
      // nonce-based CSP, 'unsafe-inline' is required on script-src in
      // production too; without it React never hydrates and the page
      // flashes SSR content then goes blank with "Connection closed".
      // keep 'unsafe-eval' in dev for webpack Fast Refresh/HMR.
      // TODO: Migrate to nonce-based CSP (requires custom Document)
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://image.tmdb.org",
      "connect-src 'self' https://api.stripe.com https://accounts.google.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(production ? ["upgrade-insecure-requests"] : []),
    ].filter(Boolean).join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
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
