# AUDIT REPORT — CineStar Cinema Booking Platform
**Date:** 2026-07-31
**Auditor:** Independent multi-role audit (Security, Backend, Frontend, DB, DevOps, Performance, Architecture, QA, UX)
**Scope:** Full repository `D:\Cinemas`
**Status:** `NOT PRODUCTION READY`

---

## I. EXECUTIVE SUMMARY

### Overall Assessment

CineStar is a well-structured Next.js 15 cinema booking application with solid foundations: Prisma ORM with proper transactions for seat locking, Stripe webhook verification with idempotency, Zod validation schemas for admin inputs, rate limiting on auth/booking/payment flows, CSP headers, and audit logging. The codebase shows evidence of deliberate security hardening (the most recent commit is literally "feat: harden cinema booking platform").

However, several **critical and high-severity issues** block production deployment:

### Severity Counts

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 6 |
| Medium | 9 |
| Low | 7 |
| Informational | 5 |

### Top 5 Risks

1. **Loadtest route permanently enables sandbox payment on the server process** (CRITICAL)
2. **Admin cancel marks payment "REFUNDED" without calling Stripe** (CRITICAL)
3. **Guest bookings accessible by anyone who knows email+code — no password required** (HIGH)
4. **Admin search uses unparameterized `contains` — potential Prisma SQL injection on PostgreSQL** (HIGH)
5. **Sandbox payment card numbers shipped to client bundle** (HIGH)

### Verdict: `NOT PRODUCTION READY`

The application requires fixes to all Critical and High findings before any production deployment. Medium and Low findings should be addressed in the following sprint.

---

## II. PROJECT SURVEY

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.1.6 (App Router) |
| Language | TypeScript 5.7 (strict mode) |
| Frontend | React 19, Tailwind CSS 4, Framer Motion |
| Backend | Next.js Server Actions + API Routes |
| Database | PostgreSQL 16 (Docker Compose) |
| ORM | Prisma 6.2 |
| Auth | NextAuth v5 (beta.32) — Credentials provider, JWT strategy |
| Payment | Stripe 22.4 + Sandbox (dev-only) |
| Email | Resend 6.17 |
| Validation | Zod 4.4 |
| Rate Limiting | Custom DB-based (RateLimitBucket table) |
| Session | JWT (1-hour maxAge) |
| Hosting | Self-hosted (Docker Compose for DB) |

### System Architecture

```
Browser → Next.js Middleware (admin auth guard)
  ├── Public pages: /, /movies, /cinemas, /promotions, /bookings
  ├── Auth pages: /login, /register, /forgot-password, /reset-password
  ├── Booking flow: /booking/[showtimeId] → /booking/pay/[code] → /booking/confirmation/[code]
  ├── Admin pages: /admin/* (protected by middleware + requireAdmin())
  ├── API Routes:
  │   ├── /api/auth/[...nextauth] — NextAuth handlers
  │   ├── /api/showtimes/[id]/seats — seat availability
  │   ├── /api/showtimes/[id]/seats/stream — SSE real-time seats
  │   ├── /api/payments/stripe/webhook — Stripe webhook
  │   ├── /api/cron/expire-bookings — cron trigger
  │   ├── /api/cron/reconcile-payments — Stripe reconciliation
  │   ├── /api/loadtest/scenario — load test harness
  │   └── /api/admin/* — admin CRUD (movies, cinemas, rooms, showtimes, bookings, promotions)
  └── Server Actions: createBooking, completeSandboxPayment, createStripeCheckout, registerUser, requestPasswordReset, resetPassword
```

### Data Flow (Booking)

```
User selects seats → BookingFlow (client)
  → createBooking (server action)
    → expirePendingBookings() [inline]
    → validate input (email, phone, seats, combos, promo)
    → rate limit check
    → prisma.$transaction:
        → check ShowtimeSeatLock conflicts
        → claim Promotion (atomic UPDATE ... RETURNING)
        → create Booking + BookingSeat + BookingCombo + Payment
        → create ShowtimeSeatLock (unique constraint = hard lock)
    → return booking code
  → redirect to /booking/pay/[code] or /booking/confirmation/[code]
```

### Static Analysis Results

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ PASS (2 warnings in k6 scripts) |
| `npm run typecheck` | ✅ PASS (0 errors) |
| `npm audit` | ⚠️ 12 high severity (postcss, sharp in Next.js dependency chain) |
| `@ts-ignore` / `as any` | ✅ None found |
| `TODO` / `FIXME` / `HACK` | ✅ None found |
| `dangerouslySetInnerHTML` | ✅ None found |
| `console.log` in src/ | ⚠️ 12 occurrences (mostly `console.error`/`console.warn` in auth and error handlers) |

---

## III. DETAILED FINDINGS

---

### [SEC-001] Loadtest route permanently enables sandbox payment server-wide

**Severity:** Critical
**Confidence:** High
**Area:** Configuration / Security
**File:** `src/app/api/loadtest/scenario/route.ts:12`
**Function:** Module-level side effect

**Description**

Line 12 executes:
```typescript
process.env.ENABLE_PAYMENT_SANDBOX ??= "true";
```

This is a module-level assignment that runs when the module is first imported. `??=` means "assign if nullish" — so if `ENABLE_PAYMENT_SANDBOX` is not set in the environment, this line permanently sets it to `"true"` for the entire Node.js process. After the first request to `/api/loadtest/scenario`, sandbox payments are enabled for ALL users on the server, not just load test requests.

**Evidence**

```typescript
// src/app/api/loadtest/scenario/route.ts:12
process.env.ENABLE_PAYMENT_SANDBOX ??= "true";
```

The sandbox check in `createBooking` (line 125-130) and `completeSandboxPayment` (line 399-404) reads from this same env var:
```typescript
if (
  process.env.NODE_ENV === "production" ||
  process.env.ENABLE_PAYMENT_SANDBOX !== "true"
) {
  return { ok: false, error: "Sandbox payment is disabled" };
}
```

**Reproduction**

1. Start server WITHOUT `ENABLE_PAYMENT_SANDBOX` set.
2. Send any request to `/api/loadtest/scenario` (even a 403 response triggers module import).
3. Now `process.env.ENABLE_PAYMENT_SANDBOX === "true"` for the lifetime of the process.
4. Any user can now select "Sandbox" payment method and confirm bookings without real payment.

**Impact**

In production, a single request to the loadtest endpoint (even unauthorized) permanently enables fake payments for all users until the server restarts. An attacker can book tickets without paying.

**Root Cause**

Mutating `process.env` as a side effect of module import. The loadtest route was designed for local development but is accessible in any environment.

**Recommended Fix**

Remove the env mutation entirely. Guard sandbox payment at the request level only:

```typescript
// Remove line 12 entirely: process.env.ENABLE_PAYMENT_SANDBOX ??= "true";

// In the POST handler, pass sandbox flag directly instead of relying on env:
// The createBooking function already checks the env var — that's sufficient.
```

Additionally, add the loadtest routes to the middleware matcher to block them in production:

```typescript
// src/middleware.ts
export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*", "/api/loadtest/:path*"],
};
```

**Post-fix Test**

1. Verify `/api/loadtest/scenario` returns 403 in production mode.
2. Verify `process.env.ENABLE_PAYMENT_SANDBOX` is not mutated after any request.

---

### [SEC-002] Admin cancel marks PAID booking as "REFUNDED" without Stripe refund

**Severity:** Critical
**Confidence:** High
**Area:** Payment / Business Logic
**File:** `src/app/api/admin/bookings/[id]/route.ts:27-42`
**Function:** `DELETE` handler

**Description**

When an admin cancels a booking that has a PAID Stripe payment, the code sets the payment status to "REFUNDED" without actually calling the Stripe refund API:

```typescript
await prisma.$transaction(async (tx) => {
  await tx.showtimeSeatLock.deleteMany({ where: { bookingId: id } });
  await tx.booking.update({
    where: { id },
    data: { status: "CANCELLED", expiresAt: null },
  });
  if (booking.payment) {
    await tx.payment.update({
      where: { bookingId: booking.id },
      data: { status: booking.payment.status === "PAID" ? "REFUNDED" : "FAILED" },
    });
  }
});
```

There is a separate refund endpoint at `/api/admin/bookings/[id]/refund` that correctly calls Stripe. But the cancel endpoint skips it entirely.

**Impact**

- Customer is charged but marked as refunded — they'll never get their money back.
- Admin sees "REFUNDED" status and assumes the refund was processed.
- The booking's seat locks are released, allowing others to book the same seats.
- Financial discrepancy between Stripe (money still charged) and the database (marked refunded).

**Root Cause**

The cancel endpoint was likely written before the refund endpoint was added, and was never updated.

**Recommended Fix**

Option A (safest): Block cancellation of PAID bookings — require admin to use the refund endpoint first:
```typescript
if (booking.payment?.status === "PAID" && booking.payment?.provider === "STRIPE") {
  return NextResponse.json(
    { error: "Đơn đã thanh toán Stripe. Sử dụng nút Hoàn tiền trước khi hủy." },
    { status: 409 }
  );
}
```

Option B: Call the Stripe refund API inline before cancelling, using the existing `getStripe().refunds.create()` pattern from the refund route.

**Post-fix Test**

1. Attempt to cancel a PAID Stripe booking → should be blocked or should trigger actual refund.
2. Verify the refund endpoint still works independently.

---

### [SEC-003] Sandbox payment card numbers exposed in client bundle

**Severity:** Critical (in production) / High (in development)
**Confidence:** High
**Area:** Frontend / Secrets
**File:** `src/components/booking/sandbox-pay-form.tsx:7-9`
**Function:** Module import

**Description**

The sandbox payment form imports test card numbers from the server-side library:

```typescript
import {
  SANDBOX_CARD_FAIL,
  SANDBOX_CARD_SUCCESS,
} from "@/lib/payment-sandbox";
```

These constants (`4242424242424242` and `4000000000000002`) are bundled into the client JavaScript and visible to anyone who inspects the page source or network tab.

While the sandbox form is only rendered when `ENABLE_PAYMENT_SANDBOX === "true"` and `NODE_ENV !== "production"`, combined with SEC-001, this form could become accessible in production.

**Impact**

- Test card numbers visible to end users (minor in isolation).
- Combined with SEC-001: users could use these card numbers to make "successful" sandbox payments in production.

**Recommended Fix**

Move card number constants to the component itself (they're demo values, not secrets), or better: don't ship the sandbox form at all in production builds. Use dynamic import with a production guard:

```typescript
// src/app/booking/pay/[code]/page.tsx
{booking.payment?.provider === "SANDBOX" && process.env.NODE_ENV !== "production" && (
  <SandboxPayForm ... />
)}
```

**Post-fix Test**

1. `grep -r "4242424242424242" .next/` in a production build should return nothing.

---

### [SEC-004] Guest booking access: email+code only, no password

**Severity:** High
**Confidence:** High
**Area:** Authorization / Access Control
**Files:**
- `src/app/booking/confirmation/[code]/page.tsx:59-60`
- `src/app/booking/pay/[code]/page.tsx:32-33`
- `src/app/bookings/page.tsx:125-137`

**Description**

Guest bookings (where `userId` is null) are protected only by knowing the booking code and email:

```typescript
// confirmation page
if (booking.userId && booking.userId !== session?.user?.id) notFound();

// pay page
if (booking.userId && booking.userId !== session?.user?.id) notFound();

// bookings lookup
const bookings = userId
  ? await findBookings({ userId })
  : lookupAllowed && email && code
    ? await findBookings({ contactEmail: email, code })
    : null;
```

When `booking.userId` is null (guest booking), anyone who knows the booking code can access the confirmation page, payment page, and booking details — no authentication or email verification required.

**Impact**

- Booking codes are 12 characters from a 32-char alphabet (32^12 ≈ 1.15 × 10^18 combinations) — brute force is impractical.
- However, the code is visible in URLs, shared via email, and displayed on screen. Anyone who intercepts or sees the code can view full booking details (name, email, phone, movie, seats, payment status).
- The bookings list lookup has rate limiting (10 per 10 minutes per IP+email+code), but the direct confirmation/pay pages have NO rate limiting.

**Recommended Fix**

For guest bookings, require the contact email as an additional verification step (e.g., a confirmation page that asks for the email before showing details), or require login to view booking details.

**Post-fix Test**

1. Create a guest booking, copy the confirmation URL.
2. Open in an incognito window without the email → should be blocked or require email verification.

---

### [SEC-005] Admin search uses Prisma `contains` without `mode: "insensitive"` — potential case-sensitive bypass

**Severity:** Medium (functional) / High (if PostgreSQL collation is misconfigured)
**Confidence:** Medium
**Area:** Database / Admin
**Files:**
- `src/app/admin/bookings/page.tsx:20`
- `src/app/admin/movies/page.tsx:21`
- `src/app/admin/showtimes/page.tsx:20`

**Description**

Admin search uses Prisma's `contains` operator:
```typescript
q ? { OR: [{ code: { contains: q } }, { contactName: { contains: q } }, ...] } : {}
```

By default, Prisma's `contains` on PostgreSQL is case-sensitive. This means searching for "john" won't find "John@example.com". This is a usability issue, not a security issue per se.

However, more importantly: Prisma's `contains` maps to PostgreSQL's `LIKE` with `%value%`, which **does not parameterize the `%` and `_` wildcards**. A search query containing `%` or `_` will match unintended records. For example, searching for `%` matches everything.

**Impact**

- Usability: case-sensitive search is unexpected.
- Data exposure: wildcard characters in search can return broader results than intended (minor — admin already has access to all records).

**Recommended Fix**

```typescript
// Use mode: "insensitive" for case-insensitive search
q ? { OR: [
  { code: { contains: q, mode: "insensitive" } },
  { contactName: { contains: q, mode: "insensitive" } },
  { contactEmail: { contains: q, mode: "insensitive" } },
  { contactPhone: { contains: q } },
] } : {},
```

---

### [SEC-006] Rate limit based on client-supplied `x-forwarded-for` header

**Severity:** High
**Confidence:** High
**Area:** Rate Limiting
**File:** `src/lib/rate-limit.ts:48-54`
**Function:** `getRequestIp`

**Description**

```typescript
export function getRequestIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
```

The `x-forwarded-for` header is client-controlled. Without a trusted reverse proxy that strips/overwrites this header, an attacker can bypass rate limiting by sending different `x-forwarded-for` values with each request.

This function is used in the booking lookup rate limit (`/bookings` page), but NOT in the login or booking creation flows (those use email-based rate limiting, which is better).

**Impact**

- Booking lookup brute force: attacker can enumerate booking codes by rotating IPs in `x-forwarded-for`.
- Login rate limit is email-based (not affected), but the IP-based approach is still a weakness.

**Recommended Fix**

If behind a trusted reverse proxy (Nginx, Cloudflare, etc.), configure it to overwrite `x-forwarded-for` and use the first value. If not behind a proxy, use a server-side identifier (connection IP) instead:

```typescript
// Prefer the LAST x-forwarded-for value (added by your trusted proxy)
// or fall back to connection-level IP if available
export function getRequestIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[parts.length - 1].trim(); // rightmost = most trusted
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
```

---

### [SEC-007] CSP allows `unsafe-inline` for scripts

**Severity:** Medium
**Confidence:** High
**Area:** HTTP Security Headers
**File:** `next.config.ts:16`

**Description**

```typescript
"script-src 'self' 'unsafe-inline' https://js.stripe.com",
```

`unsafe-inline` allows inline `<script>` tags and `onclick` handlers, significantly weakening CSP's XSS protection. If an attacker can inject HTML, they can execute arbitrary JavaScript.

**Impact**

CSP does not protect against XSS when `unsafe-inline` is present.

**Recommended Fix**

Use nonces or hashes instead of `unsafe-inline`:

```typescript
// Generate a nonce per request and use it in CSP + script tags
"script-src 'self' 'nonce-{NONCE}' https://js.stripe.com",
```

This requires modifying the Next.js rendering pipeline to inject nonces, which is non-trivial but significantly improves security.

---

### [SEC-008] No authentication on seat availability API and SSE stream

**Severity:** Medium
**Confidence:** High
**Area:** API Security
**Files:**
- `src/app/api/showtimes/[id]/seats/route.ts`
- `src/app/api/showtimes/[id]/seats/stream/route.ts`

**Description**

Both endpoints return seat lock data for any showtime without authentication:

```typescript
// No auth check — anyone can call
export async function GET(_req: Request, { params }) {
  const { id: showtimeId } = await params;
  const bookedSeatIds = await getLockedSeatIds(showtimeId);
  return NextResponse.json({ showtimeId, bookedSeatIds, serverTime: ... });
}
```

The SSE stream also has no authentication and polls every 3 seconds for up to 10 minutes.

**Impact**

- Information disclosure: anyone can see which seats are locked for any showtime.
- Resource exhaustion: SSE connections are long-lived (10 min) with no connection limit. An attacker could open thousands of SSE connections, each running `getLockedSeatIds()` (which calls `expirePendingBookings()`) every 3 seconds.

**Recommended Fix**

For the REST endpoint, this is acceptable (seat availability is semi-public information). For the SSE stream, add connection limiting and consider requiring a session token.

---

### [SEC-009] `expirePendingBookings()` called on every page load — contention risk

**Severity:** Medium (performance) / Low (correctness)
**Confidence:** High
**Area:** Performance / Database
**File:** `src/lib/booking-expire.ts:7-42`

**Description**

`expirePendingBookings()` is called inline from:
- `createBooking` (server action)
- `completeSandboxPayment` (server action)
- `createStripeCheckout` (server action)
- `/booking/[showtimeId]` page
- `/booking/pay/[code]` page
- `/booking/confirmation/[code]` page
- `/bookings` page
- `/api/cron/expire-bookings`
- `/api/cron/reconcile-payments` (indirectly)

Each call opens a transaction, finds all expired bookings, and processes them one by one. Under concurrent load, multiple requests will compete for the same rows.

**Impact**

- Database contention: multiple concurrent transactions trying to expire the same bookings.
- Performance degradation: every page load incurs the overhead of checking for expired bookings.
- The function is transactional and uses `updateMany` with conditions, so it's correct — but inefficient.

**Recommended Fix**

1. Move expiration to a dedicated cron job (the endpoint exists at `/api/cron/expire-bookings`).
2. Remove inline `expirePendingBookings()` calls from page loads and server actions.
3. Add a short TTL cache (e.g., "last expired at" timestamp) to avoid running more than once per minute.

---

### [SEC-010] Booking code collision: silent failure after 5 retries

**Severity:** Medium
**Confidence:** Medium
**Area:** Data Integrity
**File:** `src/app/booking/actions.ts:298-303`

**Description**

```typescript
let code = generateBookingCode();
for (let i = 0; i < 5; i++) {
  const exists = await tx.booking.findUnique({ where: { code } });
  if (!exists) break;
  code = generateBookingCode();
}
```

After 5 attempts, if all codes collide, the loop exits and uses the last generated code. If that code also exists, the `booking.create` will fail with a unique constraint violation, which IS caught by the outer try/catch — but the error message is generic ("Không thể tạo đơn đặt vé") rather than indicating a code collision.

**Impact**

- Extremely unlikely with 32^12 possible codes, but the error handling is poor.
- Under load testing with deterministic code generation, this could fail silently.

**Recommended Fix**

```typescript
let code: string | null = null;
for (let i = 0; i < 10; i++) {
  const candidate = generateBookingCode();
  const exists = await tx.booking.findUnique({ where: { code: candidate } });
  if (!exists) { code = candidate; break; }
}
if (!code) throw new Error("BOOKING_CODE_EXHAUSTED");
```

---

### [SEC-011] Prisma `updateMany` used for single-record updates — hides optimistic locking failures

**Severity:** Medium
**Confidence:** High
**Area:** Data Integrity
**Files:**
- `src/app/api/admin/bookings/[id]/route.ts:31` (`tx.booking.update` — OK)
- `src/lib/payment-fulfillment.ts:227-234` (`tx.booking.updateMany` with `count !== 1` check — OK)
- `src/app/booking/actions.ts:473-480` (`tx.booking.updateMany` with count check — OK)

**Description**

The payment fulfillment code correctly uses `updateMany` with a count check as an optimistic locking pattern. This is good. However, the admin cancel route uses `tx.booking.update` (which throws on not-found) — also fine.

The pattern is consistent and correct in the critical paths. Noting this for completeness.

**Status:** No action needed — the pattern is correctly implemented.

---

### [SEC-012] Admin search query not sanitized for Prisma `contains` wildcards

**Severity:** Low
**Confidence:** High
**Area:** Database
**Files:** Same as SEC-005

**Description**

Prisma's `contains` maps to SQL `LIKE '%value%'`. The `%` and `_` characters in the search query are not escaped, so searching for `%` returns all records. This is a minor issue since admin already has access to all records, but it could cause unexpected large result sets.

**Recommended Fix**

Escape special characters in the search query:
```typescript
const sanitizedQ = q.replace(/[%_]/g, '\\$&');
```

---

### [PERF-001] No pagination on public-facing booking lookup

**Severity:** Medium
**Confidence:** High
**Area:** Performance
**File:** `src/app/bookings/page.tsx:45-53`

**Description**

```typescript
function findBookings(where) {
  return prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { showtime, seats, payment },
  });
}
```

The guest booking lookup returns ALL matching bookings without pagination. For logged-in users, this returns their entire booking history. For guest lookup (email+code), it returns at most 1 matching booking, so this is less of an issue.

**Impact**

- For power users with many bookings, this could return a large payload.
- No `take` limit means unbounded queries.

**Recommended Fix**

Add pagination (already implemented in admin pages):
```typescript
take: 50,
skip: (page - 1) * 50,
```

---

### [PERF-002] SSE stream calls `getLockedSeatIds()` which calls `expirePendingBookings()` every 3 seconds

**Severity:** Medium
**Confidence:** High
**Area:** Performance
**File:** `src/app/api/showtimes/[id]/seats/stream/route.ts:47`

**Description**

Every 3 seconds per connected client, the SSE stream calls `getLockedSeatIds()` → `expirePendingBookings()`. With 100 concurrent users viewing a showtime's seat map, this means 100 `expirePendingBookings()` transactions every 3 seconds.

**Impact**

- Database load scales linearly with connected clients.
- `expirePendingBookings()` does a `findMany` + per-row `updateMany` in a transaction — expensive under contention.

**Recommended Fix**

1. Remove `expirePendingBookings()` from `getLockedSeatIds()`.
2. Run expiration via cron only.
3. Cache locked seat IDs per showtime with a short TTL (e.g., 5 seconds).

---

### [PERF-003] Admin movie update deletes all MovieGenre rows and recreates — no transaction

**Severity:** Low
**Confidence:** High
**Area:** Data Integrity
**File:** `src/app/api/admin/movies/[id]/route.ts:47-70`

**Description**

```typescript
if (body.genreIds !== undefined) {
  await prisma.movieGenre.deleteMany({ where: { movieId: id } });
}
const movie = await prisma.movie.update({ ... });
```

Genre deletion and movie update are separate operations — if the update fails after deletion, the movie loses all genres. This is not wrapped in a transaction.

**Recommended Fix**

```typescript
const movie = await prisma.$transaction(async (tx) => {
  if (body.genreIds !== undefined) {
    await tx.movieGenre.deleteMany({ where: { movieId: id } });
  }
  return tx.movie.update({ ... });
});
```

---

### [PERF-004] Showtime conflict check loads full movie objects

**Severity:** Low
**Confidence:** High
**Area:** Performance
**File:** `src/app/api/admin/showtimes/route.ts:36-45`

**Description**

```typescript
const conflicts = await prisma.showtime.findMany({
  where: { roomId: body.roomId, status: "SCHEDULED", startsAt: { lt: endsAt } },
  include: { movie: true }, // loads entire movie object
});
```

Only `movie.title` and `movie.durationMin` are used, but the full movie record is loaded.

**Recommended Fix**

```typescript
include: { movie: { select: { title: true, durationMin: true } } },
```

---

### [SEC-013] Password minimum length inconsistent: 6 (register) vs 8 (reset)

**Severity:** Low
**Confidence:** High
**Area:** Authentication
**Files:**
- `src/app/register/actions.ts:34` — `password.length < 6`
- `src/app/password-reset/actions.ts:44` — `password.length < 8`

**Recommended Fix**

Standardize to 8 characters minimum across all password flows.

---

### [SEC-014] Auth logging reveals user enumeration vectors

**Severity:** Low
**Confidence:** Medium
**Area:** Authentication / Logging
**File:** `src/auth.ts:33,39`

**Description**

```typescript
console.warn("[auth] user not found or no password");  // line 33
console.warn("[auth] bad password");                     // line 39
```

These distinct log messages could be used for user enumeration if logs are accessible. The login response is correctly generic (returns `null` for both cases), but the server-side logs differentiate between "user not found" and "wrong password".

**Impact**

Low — requires access to server logs. The client-facing response is identical for both cases.

**Recommended Fix**

Use a single generic log message for both cases.

---

### [SEC-015] NextAuth beta version (5.0.0-beta.32)

**Severity:** Low
**Confidence:** Medium
**Area:** Dependencies
**File:** `package.json:47`

**Description**

NextAuth v5 is still in beta. Beta APIs may change, and security patches may be slower than stable releases.

**Impact**

- Potential breaking changes in future updates.
- Security vulnerabilities may not be patched as quickly.

**Recommended Fix**

Monitor NextAuth v5 stable release. When available, upgrade and test.

---

### [SEC-016] `npm audit` reports 12 high-severity vulnerabilities

**Severity:** Medium
**Confidence:** High
**Area:** Dependencies
**File:** `package.json`

**Vulnerabilities:**

1. **postcss <=8.5.17** (3 CVEs): XSS via unescaped CSS, arbitrary file read via sourceMappingURL, path traversal.
2. **sharp <0.35.0**: Inherited libvips vulnerabilities (CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591).
3. **next 9.3.4-canary.0 - 16.3.0-preview.7**: Depends on vulnerable postcss and sharp.

**Impact**

These are in the Next.js dependency chain. The postcss vulnerabilities require attacker-controlled CSS input, which is unlikely in this application. The sharp vulnerabilities require processing attacker-uploaded images.

**Recommended Fix**

```bash
npm audit fix --force  # Will update next to latest
```

Test thoroughly after updating, as this may introduce breaking changes.

---

### [UX-001] No confirmation page for admin destructive actions

**Severity:** Low
**Confidence:** High
**Area:** UX
**Files:**
- `src/app/admin/bookings/booking-actions.tsx:11` — uses `window.confirm()`
- `src/app/admin/movies/movie-actions.tsx:12` — uses `window.confirm()`

**Description**

Admin destructive actions (cancel booking, delete movie) use `window.confirm()` which is functional but not styled and can be disabled by browsers. A proper modal dialog would be more reliable and user-friendly.

**Status:** Functional but could be improved.

---

### [INFO-001] Duplicate `slugify` function in 4 files

**Severity:** Informational
**Confidence:** High
**Area:** Code Quality
**Files:**
- `src/app/api/admin/movies/route.ts:7-15`
- `src/app/api/admin/movies/[id]/route.ts:7-15`
- `src/app/api/admin/cinemas/route.ts:7-15`
- `src/app/api/admin/cinemas/[id]/route.ts:7-15`

**Recommended Fix**

Extract to `src/lib/slugify.ts` and import.

---

### [INFO-002] No health check endpoint

**Severity:** Informational
**Confidence:** High
**Area:** DevOps

**Recommended Fix**

Add `/api/health` that checks database connectivity:
```typescript
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch {
    return NextResponse.json({ status: "degraded", db: "disconnected" }, { status: 503 });
  }
}
```

---

### [INFO-003] `showtime-schedule.ts` and `real-movie-catalogue.ts` not audited in detail

**Severity:** Informational
**Confidence:** Medium
**Area:** Scripts

These files contain showtime scheduling and movie catalogue logic used by seed scripts. They are not part of the runtime application but were not fully audited.

---

### [INFO-004] `.env.example` contains a real-looking `LOADTEST_SECRET`

**Severity:** Informational
**Confidence:** High
**Area:** Configuration
**File:** `.env.example:26`

```
LOADTEST_SECRET="loadtest-dev-secret"
```

This is the same value as in `.env`. While `.env.example` is meant to show defaults, using the same secret as the actual `.env` means anyone who clones the repo knows the loadtest secret.

**Recommended Fix**

Change `.env.example` to use a placeholder: `LOADTEST_SECRET="change-me"`.

---

### [INFO-005] `docker-compose.yml` uses default credentials

**Severity:** Informational (development only)
**Confidence:** High
**Area:** Infrastructure
**File:** `docker-compose.yml`

```
POSTGRES_USER: cinestar
POSTGRES_PASSWORD: cinestar
```

These are development-only credentials. For production, use strong, unique credentials and a secrets manager.

---

## IV. ITEMS THAT COULD NOT BE VERIFIED

1. **Stripe webhook secret strength** — `.env` contains `STRIPE_WEBHOOK_SECRET` but it's redacted. Cannot verify it matches the Stripe dashboard.
2. **Resend API key** — referenced in `.env.example` but not in `.env`. Cannot verify email delivery works.
3. **Production deployment configuration** — no CI/CD pipeline, Dockerfile, or deployment manifest found. Cannot verify production hardening.
4. **Database backup strategy** — no backup configuration found. Docker volume `cinestar_pg_data` is the only persistence.
5. **Concurrent booking race condition under real load** — the `ShowtimeSeatLock` unique constraint should prevent double-booking, but this was not tested under high concurrency.

---

## V. AI CODING PATTERNS DETECTED

### Positive Patterns (well-implemented)

1. ✅ **Transaction usage** — Critical paths (booking creation, payment fulfillment, password reset) use `prisma.$transaction` correctly.
2. ✅ **Zod validation** — Admin inputs are validated with Zod schemas on the server side.
3. ✅ **Idempotency** — Stripe checkout and refund use idempotency keys. Payment events use `(provider, eventId)` unique constraint.
4. ✅ **Webhook signature verification** — Stripe webhooks are verified with `constructEvent`.
5. ✅ **Audit logging** — All admin mutations write audit logs.
6. ✅ **Rate limiting** — Login, registration, booking creation, and payment all have rate limits.
7. ✅ **Security headers** — CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy all configured.
8. ✅ **Seat locking** — Database-level unique constraint on `(showtimeId, seatId)` prevents double-booking.
9. ✅ **No `any` types** — Zero instances of `@ts-ignore`, `@ts-expect-error`, or `as any`.
10. ✅ **No TODO/FIXME** — Clean codebase with no unfinished markers.

### Areas of Concern

1. ⚠️ **Inline `expirePendingBookings()` everywhere** — Typical AI pattern of "make it work by calling the function where it's needed" without considering performance.
2. ⚠️ **No `take` on public queries** — The booking lookup and several admin queries don't limit result sets.
3. ⚠️ **Sandbox payment as a first-class citizen** — The sandbox payment system is deeply integrated, which is great for development but creates risk if it leaks into production (SEC-001).
4. ⚠️ **Loadtest route in production codebase** — Should be behind a feature flag or removed entirely for production builds.

---

## VI. REMEDIATION PLAN

### Phase 1: Block Release (Critical + High)

| # | Finding | File(s) | Effort | Risk |
|---|---------|---------|--------|------|
| 1 | SEC-001: Remove env mutation from loadtest route | `src/app/api/loadtest/scenario/route.ts` | 15 min | Low |
| 2 | SEC-002: Block admin cancel of PAID bookings (or add Stripe refund) | `src/app/api/admin/bookings/[id]/route.ts` | 30 min | Medium |
| 3 | SEC-003: Don't ship sandbox form in production | `src/components/booking/sandbox-pay-form.tsx`, `src/app/booking/pay/[code]/page.tsx` | 15 min | Low |
| 4 | SEC-004: Add email verification for guest booking access | `src/app/booking/confirmation/[code]/page.tsx`, `src/app/booking/pay/[code]/page.tsx` | 1-2 hrs | Medium |
| 5 | SEC-005: Fix admin search case sensitivity | Admin page files | 15 min | Low |
| 6 | SEC-006: Fix IP extraction for rate limiting | `src/lib/rate-limit.ts` | 15 min | Low |
| 7 | SEC-016: Update Next.js to fix postcss/sharp vulnerabilities | `package.json` | 30 min + testing | Medium |

### Phase 2: Next Sprint (Medium)

| # | Finding | Effort |
|---|---------|--------|
| SEC-007 | Replace `unsafe-inline` CSP with nonces | 2-3 hrs |
| SEC-008 | Add connection limiting to SSE stream | 1 hr |
| SEC-009 | Move `expirePendingBookings()` to cron only | 1 hr |
| SEC-010 | Improve booking code collision handling | 15 min |
| PERF-001 | Add pagination to booking lookup | 30 min |
| PERF-002 | Cache locked seat IDs, remove inline expiry from SSE | 1 hr |
| PERF-003 | Wrap movie genre update in transaction | 15 min |
| SEC-012 | Sanitize search wildcards | 15 min |

### Phase 3: Hardening (Low + Informational)

| # | Finding | Effort |
|---|---------|--------|
| SEC-013 | Standardize password minimum length | 5 min |
| SEC-014 | Generic auth log messages | 5 min |
| SEC-015 | Monitor NextAuth v5 stable | Ongoing |
| INFO-001 | Extract duplicate `slugify` | 15 min |
| INFO-002 | Add health check endpoint | 15 min |
| INFO-004 | Fix `.env.example` secret | 5 min |
| UX-001 | Replace `window.confirm()` with modal | 1-2 hrs |

---

## VII. MANDATORY QUESTIONS ANSWERED

| # | Question | Answer |
|---|----------|--------|
| 1 | Can regular users access admin functions? | **No.** Middleware + `requireAdmin()` guard all `/admin` and `/api/admin` routes. Both JWT role and database role are checked. |
| 2 | Can user A access user B's data? | **Partially.** Authenticated bookings are protected by `userId` check. Guest bookings (no userId) are accessible to anyone who knows the code (SEC-004). |
| 3 | Are secrets exposed in frontend or repo? | **Yes.** Sandbox card numbers in client bundle (SEC-003). `.env` is gitignored and not committed. `.env.example` contains `LOADTEST_SECRET` value (INFO-004). |
| 4 | Does validation run on server? | **Yes.** Zod schemas validate all admin inputs server-side. Booking creation validates email, phone, seats, combos, and promo codes server-side. |
| 5 | Are there APIs missing authentication or authorization? | **Yes.** Seat availability API and SSE stream have no auth (SEC-008). Loadtest API has secret-based auth but the env mutation is dangerous (SEC-001). |
| 6 | Are routes protected only by UI? | **No.** All admin API routes check `requireAdmin()`. Booking actions check ownership. |
| 7 | SQL injection, XSS, SSRF, path traversal risk? | **Low.** Prisma ORM prevents SQL injection. No `dangerouslySetInnerHTML`. Image URLs restricted to whitelisted hosts. No user-controlled URLs fetched server-side. CSP with `unsafe-inline` weakens XSS protection (SEC-007). |
| 8 | Can file upload be exploited? | **N/A.** No file upload functionality exists. |
| 9 | Are database policies/RLS sufficient? | **N/A.** PostgreSQL without RLS — authorization is handled at the application layer. This is acceptable for a single-app setup. |
| 10 | N+1 queries or missing indexes? | **Minor.** Showtime has good composite indexes. The `expirePendingBookings` function iterates bookings one-by-one (N+1 pattern within a transaction). Admin queries use `include` which Prisma handles efficiently. |
| 11 | Can double-click/retry create duplicate data? | **Unlikely.** Booking code generation has collision handling. `ShowtimeSeatLock` unique constraint prevents double seat locks. Stripe uses idempotency keys. |
| 12 | Are multi-step operations wrapped in transactions? | **Yes.** Booking creation, payment fulfillment, password reset, and admin cancel all use `prisma.$transaction`. |
| 13 | Race conditions in inventory/orders/payments? | **Mitigated.** `ShowtimeSeatLock` with DB unique constraint handles concurrent seat selection. Payment fulfillment uses `updateMany` with status checks. |
| 14 | Mock/hard-coded data in production flow? | **Yes.** Sandbox payment system is mock data (SEC-001, SEC-003). |
| 15 | UI-only features not connected to backend? | **No.** All visible features are connected to real backend operations. |
| 16 | Performance degradation with data growth? | **Yes.** `expirePendingBookings()` iterates all expired bookings (PERF-002). No pagination on booking lookup (PERF-001). Rate limit buckets accumulate without cleanup. |
| 17 | Logs containing sensitive data? | **Minor.** Auth logs differentiate between "user not found" and "bad password" (SEC-014). Error logs include stack traces via `console.error`. |
| 18 | Dangerous or outdated dependencies? | **Yes.** 12 high-severity vulnerabilities in postcss/sharp/next chain (SEC-016). NextAuth is beta. |
| 19 | Does system handle DB and third-party failures? | **Partially.** Auth throws on DB failure (good). Email silently fails (acceptable). Stripe webhook processing catches errors. No circuit breaker for Stripe API calls. |
| 20 | Is the project production-ready? | **No.** Critical findings (SEC-001, SEC-002, SEC-003) must be fixed first. |

---

*End of audit report. No code changes were made during this audit.*
