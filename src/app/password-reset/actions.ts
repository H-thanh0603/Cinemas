"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issuePasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60_000),
    },
  });
  return token;
}

export async function requestPasswordReset(emailInput: string): Promise<{ ok: true }> {
  const email = emailInput.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: true };
  const limit = await consumeRateLimit(rateLimitKey("password-reset", email), 3, 60 * 60_000);
  if (!limit.allowed) return { ok: true };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true };
  const token = await issuePasswordResetToken(user.id);
  await sendPasswordResetEmail({ email, name: user.name, token });
  return { ok: true };
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token || password.length < 8 || password.length > 128) {
    return { ok: false, error: "Liên kết hoặc mật khẩu không hợp lệ" };
  }
  const now = new Date();
  const tokenHash = hashToken(token);
  const result = await prisma.$transaction(async (tx) => {
    const resetToken = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) return false;
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: resetToken.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await bcrypt.hash(password, 12) },
    });
    return true;
  });
  return result ? { ok: true } : { ok: false, error: "Liên kết đã hết hạn hoặc đã được sử dụng" };
}
