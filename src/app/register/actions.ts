"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9,10}$/;

export async function registerUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<RegisterResult> {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const password = input.password ?? "";

  if (!name || name.length < 2) {
    return { ok: false, error: "Họ tên không hợp lệ" };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Email không hợp lệ" };
  }
  if (phone && !PHONE_RE.test(phone)) {
    return { ok: false, error: "Số điện thoại không hợp lệ" };
  }
  if (password.length < 6) {
    return { ok: false, error: "Mật khẩu tối thiểu 6 ký tự" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Email đã được sử dụng" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  return { ok: true };
}
