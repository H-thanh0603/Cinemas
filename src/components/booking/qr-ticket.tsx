"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrTicket({ code }: { code: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const payload = JSON.stringify({
      type: "cinestar-ticket",
      code,
      v: 1,
    });
    QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      color: { dark: "#0a0a0f", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex h-36 w-36 items-center justify-center rounded-xl border-2 border-border bg-white p-2">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`QR mã vé ${code}`} className="h-full w-full" />
        ) : (
          <div className="h-full w-full animate-pulse rounded bg-gray-100" />
        )}
      </div>
      <p className="mt-2 text-center font-mono text-xs font-bold tracking-wider text-accent">
        {code}
      </p>
      <p className="mt-0.5 text-center text-[11px] text-muted">
        Quét mã tại quầy soát vé
      </p>
    </div>
  );
}
