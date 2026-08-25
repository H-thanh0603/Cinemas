/**
 * Next.js instrumentation hook — chạy 1 lần khi server khởi động.
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSentry } = await import("./lib/sentry");
    initSentry();
  }
}

// Tự bắt mọi lỗi server render / route handler (Next 15+), kèm request context.
export const onRequestError = async (...args: Parameters<
  typeof import("@sentry/nextjs").captureRequestError
>) => {
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(...args);
};
