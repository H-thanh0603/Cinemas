/**
 * Sentry init dùng chung cho server (node runtime) và client (browser).
 * Không set DSN → hoàn toàn no-op: dev local và build không bị ảnh hưởng.
 * Bật bằng cách set NEXT_PUBLIC_SENTRY_DSN trên Vercel (xem .env.example).
 */
import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // 10% request được trace là đủ cho đồ án; nâng lên 1.0 nếu cần soi từng
    // request khi debug sự cố.
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    // Commit SHA do Vercel cung cấp lúc build/runtime (fallback NEXT_PUBLIC_
    // cho phía browser được inline).
    release:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  });
}

/** Có bật Sentry không — dùng để guard các điểm gọi captureException lẻ. */
export function sentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
}
