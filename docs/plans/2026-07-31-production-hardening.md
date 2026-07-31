# Cinema production hardening

## Safety boundary

- Preserve the current PostgreSQL data with `pg_dump` before schema work.
- Never run `prisma migrate reset` or the destructive seed against the current database.
- Establish a PostgreSQL baseline before adding forward-only migrations.
- Exercise payment code with Stripe test doubles and signed webhook fixtures; live verification requires user-owned Stripe credentials.
- Keep unrelated user files (`laptop-store`, standalone HTML files) untouched.

## Phase 1 — Database baseline and showtime integrity

1. Back up the current database and verify the dump is readable.
2. Compare the live PostgreSQL schema with `schema.prisma`.
3. Archive the legacy SQLite migration and generate a PostgreSQL baseline.
4. Mark the baseline as applied without altering current tables.
5. Add forward-only constraints, audit/reset/rate-limit/payment event models, and showtime overlap protection.
6. Replace fixed seed slots with duration-aware scheduling.
7. Add future showtimes without deleting current bookings.
8. Verify migration status, constraints, booking locks, payments, and zero future overlaps.

## Phase 2 — Real payment lifecycle

1. Add failing tests for server-created checkout, webhook signature/replay handling, amount verification, idempotent fulfillment, reconciliation, and refunds.
2. Integrate Stripe Checkout on the server; never accept a success outcome from the client.
3. Verify signed webhooks against the raw request body and store processed event IDs.
4. Fulfill only when currency, amount, booking ID, and payment state match.
5. Add reconciliation and admin refund actions using idempotency keys.
6. Keep an explicitly development-only sandbox path when Stripe credentials are absent.

## Phase 3 — Authorization and trust-boundary validation

1. Re-check ADMIN role from PostgreSQL in `requireAdmin`.
2. Call `requireAdmin` inside every admin mutation handler.
3. Add shared Zod schemas for all admin request bodies and image URLs.
4. Add database-backed rate limiting to login, register, booking, payment, and guest lookup.
5. Add forgot/reset-password tokens with expiry, single-use consumption, and email delivery.
6. Restrict remote image hosts and add CSP/HSTS/frame/referrer/permissions headers.
7. Record admin mutations in an audit log.

## Phase 4 — Performance, resilience, and UX

1. Add pagination to booking/admin/movie lists and bound autocomplete results.
2. Reduce homepage/admin aggregate fan-out where a single grouped query is clearer.
3. Clear SSE timers immediately on cancellation.
4. Replace the remaining raw `<img>`.
5. Standardize API error codes, bounded retries, and visible loading/empty/error states.
6. Add route integration tests and multi-worker booking/showtime concurrency tests.

## Phase 5 — Cleanup and final verification

1. Move linting to ESLint CLI, remove production `console` noise and dead cinema code.
2. Keep unrelated projects and untracked user artifacts unchanged.
3. Retain the softened design tokens already requested and remove only redundant visual effects.
4. Replace external placeholders with local cinema assets where existing licensing allows; otherwise keep an explicit demo marker.
5. Run migration status, schema validation, type-check, lint, build, security/integration/concurrency tests, dependency audit, and runtime probes.
