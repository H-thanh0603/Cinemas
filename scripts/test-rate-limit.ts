import { prisma } from "../src/lib/prisma";
import { consumeRateLimit } from "../src/lib/rate-limit";

const key = `test:${Date.now()}:${Math.random()}`;

async function main() {
  const first = await consumeRateLimit(key, 2, 60_000);
  const second = await consumeRateLimit(key, 2, 60_000);
  const third = await consumeRateLimit(key, 2, 60_000);

  if (!first.allowed || !second.allowed || third.allowed) {
    throw new Error("rate limit window did not enforce the configured maximum");
  }

  await prisma.rateLimitBucket.delete({ where: { key: first.key } });
  console.log("rate limit checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
