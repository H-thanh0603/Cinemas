/**
 * Content-Security-Policy dạng nonce (strict CSP) — xem AUDIT-REPORT.md SEC-007.
 *
 * Mỗi request sinh một nonce trong `middleware.ts`; header CSP được gắn vào cả
 * request lẫn response. Next.js đọc header CSP trên request và tự chèn
 * `nonce="..."` vào toàn bộ `<script>` bootstrap của nó, nên không còn cần
 * 'unsafe-inline' cho script-src nữa.
 *
 * 'strict-dynamic' cho phép script đã được tin cậy (có nonce) nạp script con,
 * nên các script bên thứ ba nạp động vẫn chạy mà không cần allowlist host
 * trong script-src (các host allowlist bị bỏ qua khi có strict-dynamic).
 */
export function buildContentSecurityPolicy(
  nonce: string,
  options?: { development?: boolean }
): string {
  const development = options?.development ?? false;

  // Giữ nguyên các directive img/connect/frame từ cấu hình cũ (next.config.ts)
  // để không làm hỏng Stripe Checkout (redirect server-side) hay ảnh TMDB.
  return [
    "default-src 'self'",
    // 'self' chỉ còn là fallback cho trình duyệt rất cũ; mọi engine hiện đại
    // hiểu 'strict-dynamic' sẽ bỏ qua nó. Quan trọng hơn: KHÔNG còn
    // 'unsafe-inline' — XSS qua thẻ <script> inline bị chặn hoàn toàn.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      development ? " 'unsafe-eval'" : ""
    }`,
    // style-src vẫn cho phép inline: React gắn style trực tiếp lên DOM và
    // Tailwind nhúng CSS runtime; rủi ro thực tế của style injection thấp.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://image.tmdb.org",
    "connect-src 'self' https://api.stripe.com https://accounts.google.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
