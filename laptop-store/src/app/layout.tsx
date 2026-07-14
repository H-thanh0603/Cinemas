import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/context/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CompareBar } from "@/components/product/compare-bar";

export const metadata: Metadata = {
  title: { default: "TechZone — Laptop cao cấp", template: "%s | TechZone" },
  description: "Cửa hàng laptop chính hãng — TechZone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased">
        <Providers>
          <Header />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
          <CompareBar />
        </Providers>
      </body>
    </html>
  );
}
