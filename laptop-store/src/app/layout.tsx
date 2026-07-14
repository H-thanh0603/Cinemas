import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TechZone — Laptop cao cấp", template: "%s | TechZone" },
  description: "Cửa hàng laptop chính hãng — TechZone",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
