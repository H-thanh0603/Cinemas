-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'STRIPE',
ADD COLUMN     "providerCheckoutId" TEXT,
ADD COLUMN     "providerPaymentId" TEXT,
ADD COLUMN     "refundId" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentEvent_status_createdAt_idx" ON "PaymentEvent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_eventId_key" ON "PaymentEvent"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_createdAt_idx" ON "AuditLog"("entity", "entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerCheckoutId_key" ON "Payment"("providerCheckoutId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_refundId_key" ON "Payment"("refundId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing rows were created by the explicit development sandbox.
UPDATE "Payment"
SET "provider" = CASE
    WHEN "method" = 'AT_COUNTER' THEN 'COUNTER'
    ELSE 'SANDBOX'
END;

-- Historical seed showtimes are immutable history, not active schedules.
UPDATE "Showtime"
SET "status" = 'COMPLETED'
WHERE "status" = 'SCHEDULED' AND "endsAt" < CURRENT_TIMESTAMP;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "User"
    ADD CONSTRAINT "User_role_check"
    CHECK ("role" IN ('CUSTOMER', 'ADMIN'));

ALTER TABLE "Movie"
    ADD CONSTRAINT "Movie_duration_check" CHECK ("durationMin" > 0),
    ADD CONSTRAINT "Movie_popularity_check" CHECK ("popularity" >= 0),
    ADD CONSTRAINT "Movie_status_check"
        CHECK ("status" IN ('NOW_SHOWING', 'COMING_SOON', 'ARCHIVED'));

ALTER TABLE "Room"
    ADD CONSTRAINT "Room_dimensions_check" CHECK ("rows" > 0 AND "cols" > 0),
    ADD CONSTRAINT "Room_id_cinemaId_key" UNIQUE ("id", "cinemaId");

ALTER TABLE "Seat"
    ADD CONSTRAINT "Seat_number_check" CHECK ("number" > 0),
    ADD CONSTRAINT "Seat_type_check"
        CHECK ("type" IN ('NORMAL', 'VIP', 'COUPLE'));

ALTER TABLE "Showtime"
    ADD CONSTRAINT "Showtime_time_check" CHECK ("endsAt" > "startsAt"),
    ADD CONSTRAINT "Showtime_base_price_check" CHECK ("basePrice" >= 0),
    ADD CONSTRAINT "Showtime_format_check"
        CHECK ("format" IN ('2D', '3D', 'IMAX')),
    ADD CONSTRAINT "Showtime_status_check"
        CHECK ("status" IN ('SCHEDULED', 'CANCELLED', 'COMPLETED')),
    ADD CONSTRAINT "Showtime_room_cinema_fkey"
        FOREIGN KEY ("roomId", "cinemaId")
        REFERENCES "Room"("id", "cinemaId")
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "Showtime_no_scheduled_overlap"
        EXCLUDE USING gist (
            "roomId" WITH =,
            tsrange("startsAt", "endsAt", '[)') WITH &&
        )
        WHERE ("status" = 'SCHEDULED');

ALTER TABLE "FoodCombo"
    ADD CONSTRAINT "FoodCombo_price_check" CHECK ("price" >= 0);

ALTER TABLE "Promotion"
    ADD CONSTRAINT "Promotion_values_check"
    CHECK (
        "discountType" IN ('PERCENT', 'FIXED')
        AND "discountValue" > 0
        AND ("discountType" <> 'PERCENT' OR "discountValue" <= 100)
        AND ("maxDiscount" IS NULL OR "maxDiscount" >= 0)
        AND "minOrderValue" >= 0
        AND ("usageLimit" IS NULL OR "usageLimit" > 0)
        AND "usedCount" >= 0
        AND ("usageLimit" IS NULL OR "usedCount" <= "usageLimit")
        AND "expiresAt" > "startsAt"
    );

ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_status_check"
        CHECK ("status" IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
    ADD CONSTRAINT "Booking_totals_check"
    CHECK (
        "seatsTotal" >= 0
        AND "combosTotal" >= 0
        AND "discountTotal" >= 0
        AND "finalTotal" >= 0
        AND "finalTotal" = GREATEST(
            0,
            "seatsTotal" + "combosTotal" - "discountTotal"
        )
    );

ALTER TABLE "BookingSeat"
    ADD CONSTRAINT "BookingSeat_price_check" CHECK ("price" >= 0);

ALTER TABLE "BookingCombo"
    ADD CONSTRAINT "BookingCombo_values_check"
        CHECK ("quantity" > 0 AND "unitPrice" >= 0);

ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_amount_check" CHECK ("amount" >= 0),
    ADD CONSTRAINT "Payment_status_check"
        CHECK (
            "status" IN (
                'UNPAID',
                'PROCESSING',
                'PAID',
                'FAILED',
                'REFUND_PENDING',
                'REFUNDED'
            )
        ),
    ADD CONSTRAINT "Payment_provider_check"
        CHECK ("provider" IN ('STRIPE', 'SANDBOX', 'COUNTER'));

ALTER TABLE "RateLimitBucket"
    ADD CONSTRAINT "RateLimitBucket_values_check"
        CHECK ("count" >= 0 AND "expiresAt" > "windowStart");

ALTER TABLE "PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_expiry_check"
        CHECK ("expiresAt" > "createdAt");
