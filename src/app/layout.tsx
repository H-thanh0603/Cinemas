import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { PromoTicker } from "@/components/home/promo-ticker";
import { PromoPopup } from "@/components/home/promo-popup";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "CineStar — Đặt vé xem phim trực tuyến",
    template: "%s | CineStar",
  },
  description:
    "Đặt vé xem phim nhanh chóng tại hệ thống rạp CineStar. Chọn phim, chọn ghế, thanh toán trực tuyến chỉ trong vài phút.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce-based CSP (src/lib/csp.ts): đọc request headers — nơi middleware đặt
  // CSP kèm nonce — buộc MỌI route render động, nhờ đó Next gắn đúng nonce của
  // từng request vào các <script> bootstrap. Không có bước này, các trang tĩnh
  // trả HTML đóng gói lúc build (không nonce) và script bị strict-dynamic chặn.
  headers();
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <div className="aurora-bg" aria-hidden />
        <div className="film-grain" aria-hidden />
        <AuthSessionProvider>
          <ToastProvider>
            <PromoTicker />
            <ScrollToTop />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <PromoPopup />
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
