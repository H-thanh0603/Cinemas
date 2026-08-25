"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Phase = "loading" | "disabled" | "qr" | "enabled";

/**
 * Trang Bảo mật — quản lý 2FA (TOTP) cho tài khoản ADMIN.
 *
 * Luồng bật: POST /api/admin/2fa/setup → quét QR (hoặc nhập tay secret)
 *   → nhập mã 6 số → POST /api/admin/2fa/enable.
 * Luồng tắt: nhập lại mật khẩu → POST /api/admin/2fa/disable (re-auth).
 */
export default function AdminSecurityPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [otpauthUri, setOtpauthUri] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/2fa/status");
      if (res.ok) {
        const data = (await res.json()) as { enabled: boolean };
        setPhase(data.enabled ? "enabled" : "disabled");
      } else {
        setPhase("disabled");
      }
    } catch {
      setPhase("disabled");
    }
  }, []);

  useEffect(() => {
    // Fetch trạng thái khi mount; setState nằm trong callback của promise
    // (không đồng bộ trong effect) nên không gây cascading render.
    let cancelled = false;
    fetch("/api/admin/2fa/status")
      .then((res) => (res.ok ? res.json() : Promise.resolve({ enabled: false })))
      .then((data: { enabled?: boolean }) => {
        if (!cancelled) setPhase(Boolean(data.enabled) ? "enabled" : "disabled");
      })
      .catch(() => {
        if (!cancelled) setPhase("disabled");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function startSetup() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/2fa/setup", { method: "POST" });
      const data = (await res.json()) as {
        qrDataUrl?: string;
        otpauthUri?: string;
        secret?: string;
        error?: string;
      };
      if (!res.ok || !data.qrDataUrl) {
        setMessage({ kind: "err", text: data.error ?? "Không tạo được QR" });
        return;
      }
      setQrDataUrl(data.qrDataUrl);
      setOtpauthUri(data.otpauthUri ?? "");
      setSecret(data.secret ?? "");
      setPhase("qr");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Xác nhận thất bại" });
        return;
      }
      setMessage({ kind: "ok", text: "Đã bật 2FA. Từ giờ mỗi lần đăng nhập cần mã authenticator." });
      setPassword("");
      setCode("");
      await loadStatus();
    } finally {
      setBusy(false);
    }
  }

  async function disableTwoFactor() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Không tắt được 2FA" });
        return;
      }
      setMessage({ kind: "ok", text: "Đã tắt 2FA." });
      setPassword("");
      await loadStatus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Bảo mật</h1>
        <p className="mt-1 text-sm text-muted">
          Xác thực hai lớp (2FA/TOTP) cho tài khoản quản trị. Admin nắm quyền
          hoàn tiền và xóa dữ liệu nên nên luôn bật lớp bảo vệ thứ hai này.
        </p>
      </div>

      {phase === "loading" && <p className="text-sm text-muted">Đang tải…</p>}

      {(phase === "disabled" || phase === "qr") && (
        <section className="rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold">Xác thực hai lớp</h2>
              <p className="mt-1 text-sm text-muted">
                {phase === "qr"
                  ? "Quét mã bằng Google Authenticator/Authy rồi nhập mã 6 số để kích hoạt."
                  : "Đang tắt. Tài khoản chỉ được bảo vệ bằng mật khẩu."}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                phase === "qr"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {phase === "qr" ? "CHỜ KÍCH HOẠT" : "TẮT"}
            </span>
          </div>

          {phase === "qr" && (
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {/* data URL từ thư viện qrcode — img-src 'data:' đã cho phép trong CSP */}
              <Image
                src={qrDataUrl}
                alt="Mã QR cài đặt 2FA"
                width={180}
                height={180}
                unoptimized
                className="rounded-xl border border-border bg-white p-1"
              />
              <div className="w-full space-y-3">
                <details className="text-xs text-muted">
                  <summary className="cursor-pointer select-none">
                    Không quét được? Nhập khóa thủ công
                  </summary>
                  <code className="mt-1 block break-all rounded-lg bg-surface p-2">
                    {secret}
                  </code>
                  <span className="mt-1 block">{otpauthUri}</span>
                </details>
                <label htmlFor="totp-confirm" className="block text-sm font-medium">
                  Mã xác thực từ ứng dụng
                </label>
                <input
                  id="totp-confirm"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-lg font-bold tracking-[0.4em] outline-none ring-primary/40 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => void confirmEnable()}
                  disabled={busy || code.length !== 6}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition hover:brightness-110 disabled:opacity-50 sm:w-auto sm:min-w-48"
                >
                  Kích hoạt 2FA
                </button>
              </div>
            </div>
          )}

          {phase === "disabled" && (
            <button
              type="button"
              onClick={() => void startSetup()}
              disabled={busy}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition hover:brightness-110 disabled:opacity-50 sm:w-auto sm:min-w-48"
            >
              {busy ? "Đang tạo…" : "Bật 2FA ngay"}
            </button>
          )}
        </section>
      )}

      {phase === "enabled" && (
        <section className="rounded-2xl border border-emerald-500/30 bg-surface-raised p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold">Xác thực hai lớp đang bật</h2>
              <p className="mt-1 text-sm text-muted">
                Mỗi lần đăng nhập sẽ yêu cầu mã 6 số từ ứng dụng authenticator.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
              ĐANG BẬT
            </span>
          </div>

          <div className="mt-5 space-y-3 border-t border-border pt-5">
            <label htmlFor="disable-password" className="block text-sm font-medium">
              Nhập mật khẩu để tắt 2FA
            </label>
            <input
              id="disable-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
              placeholder="Mật khẩu hiện tại"
            />
            <button
              type="button"
              onClick={() => void disableTwoFactor()}
              disabled={busy || !password}
              className="w-full rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm font-bold text-danger transition hover:bg-danger/20 disabled:opacity-50 sm:w-auto sm:min-w-48"
            >
              Tắt 2FA
            </button>
          </div>
        </section>
      )}

      {message && (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
