CREATE INDEX IF NOT EXISTS "Movie_createdAt_idx" ON "Movie"("createdAt");
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX IF NOT EXISTS "Showtime_status_startsAt_idx" ON "Showtime"("status", "startsAt");
CREATE INDEX IF NOT EXISTS "Payment_status_updatedAt_idx" ON "Payment"("status", "updatedAt");
