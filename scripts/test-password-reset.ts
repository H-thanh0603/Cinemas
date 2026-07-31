import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import {
  issuePasswordResetToken,
  resetPassword,
} from "../src/app/password-reset/actions";

async function main() {
  const email = `reset-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      name: "Reset Test",
      passwordHash: await bcrypt.hash("old-password", 10),
      role: "CUSTOMER",
    },
  });

  const token = await issuePasswordResetToken(user.id);
  const result = await resetPassword(token, "new-password");
  if (!result.ok) throw new Error(result.error);

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await bcrypt.compare("new-password", updated.passwordHash ?? ""))) {
    throw new Error("password was not updated");
  }
  const replay = await resetPassword(token, "another-password");
  if (replay.ok) throw new Error("reset token was reusable");

  await prisma.user.delete({ where: { id: user.id } });
  console.log("password reset checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
