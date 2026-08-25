-- Align database baseline with schema.prisma.
-- The original baseline created a redundant composite FK
--   Showtime(roomId, cinemaId) -> Room(id, cinemaId)
-- plus its supporting UNIQUE constraint Room(id, cinemaId). schema.prisma
-- only declares the single-column Showtime.room relation, so Prisma reports
-- both objects as drift. Dropping them is safe: the plain
-- Showtime_roomId_fkey FK already enforces the relationship.
ALTER TABLE "Showtime" DROP CONSTRAINT "Showtime_room_cinema_fkey";
ALTER TABLE "Room" DROP CONSTRAINT "Room_id_cinemaId_key";
