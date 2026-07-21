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

  const [email, setEmail] = useState("admin@cinestar.vn");
  const [password, setPassword] = useState("");
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

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(
        res.error === "CredentialsSignin"
          ? "Email hoặc mật khẩu không đúng"
          : "Không thể đăng nhập — kiểm tra database đang chạy (Docker Postgres)"
      );
      setLoading(false);
      return;
    }

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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-black text-white shadow-lg shadow-primary/30">
            C
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Cine<span className="text-primary">Star</span> Admin
          </h1>
          <p className="mt-2 text-sm text-muted">
            Đăng nhập bằng tài khoản có role <b className="text-foreground">ADMIN</b>
          </p>
          <p className="mt-1 text-xs text-muted">
            Demo: <code className="text-accent">admin@cinestar.vn</code> /{" "}
            <code className="text-accent">admin123</code>
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

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password || !email}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
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
