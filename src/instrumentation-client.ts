/**
 * Browser-side Sentry init (Next.js App Router convention).
 * Chỉ kích hoạt khi NEXT_PUBLIC_SENTRY_DSN được set lúc build.
 */
import { initSentry } from "./lib/sentry";

initSentry();
