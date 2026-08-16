"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { login, type LoginResult } from "./actions";

const initial: LoginResult = { ok: true };

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);
  const next = useSearchParams().get("next") ?? "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl font-black text-white shadow-lg shadow-primary/20">
            C
          </span>
          <h1 className="mt-4 text-xl font-bold">
            Cine<span className="text-primary">Star</span> Admin
          </h1>
          <p className="mt-1 text-sm text-muted">Đăng nhập để quản lý rạp</p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              placeholder="admin@cinestar.vn"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {!state.ok && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
