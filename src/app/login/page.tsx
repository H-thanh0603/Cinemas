"use client";

import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      // CredentialsSignin = wrong password; Configuration/others = server/DB issues
      const msg =
        res.error === "CredentialsSignin"
          ? "Email hoặc mật khẩu không đúng"
          : res.error === "Configuration"
            ? "Lỗi cấu hình đăng nhập (AUTH_SECRET / server)"
            : "Không thể đăng nhập — kiểm tra database đang chạy (Docker Postgres)";
      setError(msg);
      return;
    }

    // Admin users → admin dashboard unless a specific non-admin callback was requested
    try {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = (await sessionRes.json()) as {
        user?: { role?: string };
      };
      if (
        sessionData.user?.role === "ADMIN" &&
        (!callbackUrl || callbackUrl === "/" || callbackUrl.startsWith("/admin"))
      ) {
        router.replace("/admin");
        router.refresh();
        return;
      }
    } catch {
      /* fall through */
    }

    router.replace(callbackUrl || "/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-surface-raised p-8 shadow-xl">
        <h1 className="text-center text-2xl font-extrabold">Đăng nhập</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Tài khoản demo: <code className="text-accent">khach@example.com</code> /{" "}
          <code className="text-accent">khach123</code>
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
              required
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
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
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted">
          Đang tải…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
