import type { Metadata } from "next";
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
  return (
    <html lang="vi" className={`${inter.variable} ${outfit.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
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
