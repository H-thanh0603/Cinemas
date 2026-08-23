-- Ported from main's system-hardening: client retry idempotency for createBooking.
-- (expiresAt, seat-lock and payment indexes already exist in the PostgreSQL baseline.)
ALTER TABLE "Booking" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");
