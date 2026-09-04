import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { consumeRateLimit, getRequestIp, rateLimitKey } from "@/lib/rate-limit";
import { checkAdminTwoFactor } from "@/lib/two-factor";

/**
 * Bật 2FA cho tài khoản ADMIN: lần submit đầu (chưa có mã) ném lỗi có
 * code="TOTP_REQUIRED" để trang login hiển thị ô nhập mã thay vì báo
 * "sai mật khẩu". Client đọc được code qua kết quả signIn(redirect:false).
 */
class TotpRequiredError extends CredentialsSignin {
  override code = "TOTP_REQUIRED";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "Mã 2FA", type: "text" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email?.toString().trim().toLowerCase() ?? "";
        try {
          const password = credentials?.password?.toString() ?? "";
          if (!email || !password) return null;
          const loginLimit = await consumeRateLimit(
            rateLimitKey("login", email),
            10,
            15 * 60_000
          );
          if (!loginLimit.allowed) return null;

          // Chống quét nhiều tài khoản từ 1 IP. getRequestIp lấy rightmost
          // của x-forwarded-for — chỉ đáng tin khi deploy sau reverse proxy
          // (Vercel/nginx tự ghi đè header). Không xác định được IP thì bỏ qua.
          const ip = request ? getRequestIp(request.headers) : "unknown";
          if (ip !== "unknown") {
            const ipLimit = await consumeRateLimit(
              rateLimitKey("login-ip", ip),
              50,
              15 * 60_000
            );
            if (!ipLimit.allowed) return null;
          }

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              passwordHash: true,
              twoFactorEnabled: true,
              twoFactorSecret: true,
            },
          });
          if (!user?.passwordHash) {
            logger.warn("login failed", { email });
            return null;
          }
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) {
            logger.warn("login failed", { email });
            return null;
          }

          // 2FA cho ADMIN: thiếu mã → TOTP_REQUIRED (UI hiện ô nhập mã),
          // sai mã → fail chung như sai mật khẩu.
          const twoFactor = await checkAdminTwoFactor(
            {
              role: user.role,
              twoFactorEnabled: user.twoFactorEnabled,
              twoFactorSecret: user.twoFactorSecret,
            },
            credentials?.totpCode?.toString()
          );
          if (twoFactor.outcome === "totp_required") {
            logger.warn("admin login requires totp", { email });
            throw new TotpRequiredError();
          }
          if (twoFactor.outcome === "invalid_code") {
            logger.warn("admin login invalid totp", { email });
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (err) {
          // Lỗi 2FA có chủ đích phải truyền nguyên trạng lên UI
          if (err instanceof TotpRequiredError) throw err;
          // DB down / Prisma errors previously looked like "wrong password"
          logger.error("authorize failed", err, { email });
          throw new Error("AUTH_SERVICE_UNAVAILABLE");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "CUSTOMER";
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});
