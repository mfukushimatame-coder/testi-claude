import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

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
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-beige-100 text-sage-900">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
