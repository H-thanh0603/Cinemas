import { sign, verifySession } from "./src/lib/auth";
import { PrismaClient } from "@prisma/client";

async function main() {
  const token = await sign(`admin:${Date.now() + 60_000}`);
  if (!(await verifySession(token))) throw new Error("valid token must verify");
  if (await verifySession(token + "x")) throw new Error("tampered token must fail");
  if (await verifySession(await sign(`admin:${Date.now() - 1000}`)))
    throw new Error("expired token must fail");

  const prisma = new PrismaClient();
  const bs = await prisma.bookingSeat.findFirst();
  if (!bs) throw new Error("no seeded bookingSeat");
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "BookingSeat" (id, bookingId, seatId, showtimeId, ticketTypeId, price) VALUES ('test-dup', ?, ?, ?, ?, 0)`,
      bs.bookingId, bs.seatId, bs.showtimeId, bs.ticketTypeId
    );
    throw new Error("FAIL: duplicate (showtimeId, seatId) was allowed");
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "P2002" || /UNIQUE constraint failed/.test(err.message ?? "")) {
      console.log("constraint rejected duplicate as expected");
    } else {
      throw e;
    }
  }
  console.log("OK: session verify + double-booking constraint");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
