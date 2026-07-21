import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    select: { email: true, role: true, passwordHash: true, name: true },
  });
  console.log(
    "users",
    users.map((u) => ({
      email: u.email,
      role: u.role,
      hasHash: !!u.passwordHash,
      hashPrefix: u.passwordHash?.slice(0, 10),
    }))
  );
  for (const u of users) {
    if (!u.passwordHash) {
      console.log(u.email, "NO HASH");
      continue;
    }
    const a = await bcrypt.compare("admin123", u.passwordHash);
    const k = await bcrypt.compare("khach123", u.passwordHash);
    console.log(u.email, "admin123?", a, "khach123?", k);
  }
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
