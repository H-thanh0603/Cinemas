"use client";

import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const notAdmin = searchParams.get("reason") === "not_admin";
  const { data: session } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Bước 2 của đăng nhập admin có 2FA: server trả code "TOTP_REQUIRED"
  // khi mật khẩu đúng nhưng thiếu mã → hiện ô nhập mã xác thực.
  const [awaiting2fa, setAwaiting2fa] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState(
    notAdmin
      ? "Tài khoản hiện tại không có quyền quản trị. Đăng nhập bằng tài khoản ADMIN."
      : ""
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Clear previous session so we don't mix customer + admin
    await signOut({ redirect: false });

    const res = (await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      ...(awaiting2fa ? { totpCode } : {}),
      redirect: false,
    })) as { error?: string; code?: string } | undefined;

    if (res?.error) {
      if (res.code === "TOTP_REQUIRED") {
        setAwaiting2fa(true);
        setError(
          "Mật khẩu đúng. Tài khoản đã bật 2FA — hãy nhập mã 6 số từ ứng dụng authenticator."
        );
      } else {
        setError(
          awaiting2fa
            ? "Email, mật khẩu hoặc mã 2FA không đúng"
            : res.error === "CredentialsSignin"
              ? "Email hoặc mật khẩu không đúng"
              : "Không thể đăng nhập — kiểm tra database đang chạy (Docker Postgres)"
        );
      }
      setLoading(false);
      return;
    }

    setAwaiting2fa(false);

    // Verify ADMIN role via session endpoint
    const sessionRes = await fetch("/api/auth/session");
    const sessionData = (await sessionRes.json()) as {
      user?: { role?: string };
    };

    if (sessionData.user?.role !== "ADMIN") {
      await signOut({ redirect: false });
      setError("Tài khoản này không có quyền ADMIN");
      setLoading(false);
      return;
    }

    setLoading(false);
    const dest =
      callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("/admin/login")
        ? callbackUrl
        : "/admin";
    router.replace(dest);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-raised p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-black text-on-primary shadow-lg shadow-primary/30">
            C
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Cine<span className="text-primary">Star</span> Admin
          </h1>
          <p className="mt-2 text-sm text-muted">
            Đăng nhập bằng tài khoản có role <b className="text-foreground">ADMIN</b>
          </p>
        </div>

        {session?.user && session.user.role !== "ADMIN" && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Bạn đang đăng nhập là <b>{session.user.email}</b> (không phải ADMIN).
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
              required
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm font-medium"
            >
              Mật khẩu
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
              placeholder="Mật khẩu tài khoản ADMIN"
              required
            />
          </div>

          {awaiting2fa && (
            <div>
              <label
                htmlFor="admin-totp"
                className="mb-1.5 block text-sm font-medium"
              >
                Mã xác thực 2 lớp (2FA)
              </label>
              <input
                id="admin-totp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-lg font-bold tracking-[0.4em] outline-none ring-primary/40 focus:ring-2"
                placeholder="000000"
                required
              />
              <p className="mt-1.5 text-xs text-muted">
                Mở ứng dụng authenticator (Google Authenticator, Authy…) để lấy mã.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              !password ||
              !email ||
              (awaiting2fa && totpCode.length !== 6)
            }
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập quản trị"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/login" className="hover:text-primary">
            Đăng nhập khách
          </Link>
          {" · "}
          <Link href="/" className="hover:text-primary">
            Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted">
          Đang tải…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
