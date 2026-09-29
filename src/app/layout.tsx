import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import TmaHeader from "@/components/TmaHeader";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "SkillTree — Первая работа в IT & Прокачка разработчика",
  description:
    "Telegram Mini App для поиска первой работы в IT, генерации ИИ-резюме, тренировки собеседований и прокачки дерева навыков.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased selection:bg-manga-yellow selection:text-manga-ink">
        {/* Strict Mobile-First Telegram Mini App Container */}
        <div className="relative mx-auto w-full max-w-[430px] min-h-dvh bg-halftone border-x-[3px] border-manga-ink flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <TmaHeader />
          <main className="flex-1 px-3.5 pt-4 pb-28">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
