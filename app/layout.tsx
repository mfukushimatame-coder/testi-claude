import type { Metadata } from "next";
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`h-full ${notoSansJP.variable}`}>
      <body className="min-h-full bg-[#f2f4f2] text-gray-900 font-[family-name:var(--font-noto)]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
