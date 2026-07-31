-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "backdropUrl" TEXT,
    "trailerUrl" TEXT,
    "durationMin" INTEGER NOT NULL,
    "ageRating" TEXT NOT NULL,
    "director" TEXT NOT NULL,
    "cast" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMING_SOON',
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieGenre" (
    "movieId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "MovieGenre_pkey" PRIMARY KEY ("movieId","genreId")
);

-- CreateTable
CREATE TABLE "Cinema" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "openingHours" TEXT NOT NULL DEFAULT '8:00 - 23:00',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cinema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "cols" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NORMAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Showtime" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "format" TEXT NOT NULL DEFAULT '2D',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Showtime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceModifier" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCombo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'COMBO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FoodCombo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "maxDiscount" INTEGER,
    "minOrderValue" INTEGER NOT NULL DEFAULT 0,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "showtimeId" TEXT NOT NULL,
    "userId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "seatsTotal" INTEGER NOT NULL,
    "combosTotal" INTEGER NOT NULL,
    "discountTotal" INTEGER NOT NULL DEFAULT 0,
    "finalTotal" INTEGER NOT NULL,
    "promotionId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowtimeSeatLock" (
    "showtimeId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShowtimeSeatLock_pkey" PRIMARY KEY ("showtimeId","seatId")
);

-- CreateTable
CREATE TABLE "BookingSeat" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "BookingSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingCombo" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "BookingCombo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3),
    "sandboxTxnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_slug_key" ON "Movie"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Cinema_slug_key" ON "Cinema"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Room_cinemaId_name_key" ON "Room"("cinemaId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_roomId_row_number_key" ON "Seat"("roomId", "row", "number");

-- CreateIndex
CREATE INDEX "Showtime_movieId_startsAt_idx" ON "Showtime"("movieId", "startsAt");

-- CreateIndex
CREATE INDEX "Showtime_roomId_startsAt_idx" ON "Showtime"("roomId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "TicketType_code_key" ON "TicketType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_code_key" ON "Booking"("code");

-- CreateIndex
CREATE INDEX "Booking_showtimeId_idx" ON "Booking"("showtimeId");

-- CreateIndex
CREATE INDEX "Booking_contactEmail_idx" ON "Booking"("contactEmail");

-- CreateIndex
CREATE INDEX "Booking_status_expiresAt_idx" ON "Booking"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "ShowtimeSeatLock_bookingId_idx" ON "ShowtimeSeatLock"("bookingId");

-- CreateIndex
CREATE INDEX "BookingSeat_seatId_idx" ON "BookingSeat"("seatId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSeat_bookingId_seatId_key" ON "BookingSeat"("bookingId", "seatId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingCombo_bookingId_comboId_key" ON "BookingCombo"("bookingId", "comboId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- AddForeignKey
ALTER TABLE "MovieGenre" ADD CONSTRAINT "MovieGenre_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieGenre" ADD CONSTRAINT "MovieGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Showtime" ADD CONSTRAINT "Showtime_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Showtime" ADD CONSTRAINT "Showtime_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Showtime" ADD CONSTRAINT "Showtime_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowtimeSeatLock" ADD CONSTRAINT "ShowtimeSeatLock_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowtimeSeatLock" ADD CONSTRAINT "ShowtimeSeatLock_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowtimeSeatLock" ADD CONSTRAINT "ShowtimeSeatLock_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSeat" ADD CONSTRAINT "BookingSeat_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSeat" ADD CONSTRAINT "BookingSeat_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSeat" ADD CONSTRAINT "BookingSeat_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCombo" ADD CONSTRAINT "BookingCombo_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCombo" ADD CONSTRAINT "BookingCombo_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "FoodCombo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
