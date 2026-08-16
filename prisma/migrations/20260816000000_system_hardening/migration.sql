-- Booking: idempotency key + expiry for pay-at-counter holds
ALTER TABLE "Booking" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Booking" ADD COLUMN "expiresAt" DATETIME;
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- BookingSeat: denormalized showtimeId + hard double-booking guard
ALTER TABLE "BookingSeat" ADD COLUMN "showtimeId" TEXT;
UPDATE "BookingSeat" SET "showtimeId" = (
  SELECT "showtimeId" FROM "Booking" WHERE "Booking"."id" = "BookingSeat"."bookingId"
);
-- SQLite ALTER cannot add NOT NULL without default; enforce via unique index + app writes
CREATE UNIQUE INDEX "BookingSeat_showtimeId_seatId_key" ON "BookingSeat"("showtimeId", "seatId");

-- Payment: status index
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
