import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "KakeSo（カケソ）",
  description: "チャットで記録、SNSで節約モチベUP！Z世代の家計簿アプリ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KakeSo",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`h-full ${notoSansJP.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full bg-[#f2f4f2] text-gray-900 font-[family-name:var(--font-noto)]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
