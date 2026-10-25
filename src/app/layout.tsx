import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import TmaHeader from "@/components/TmaHeader";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import { TelegramProvider } from "@/context/TelegramProvider";

export const metadata: Metadata = {
  title: "SkillTree // Cyber-Terminal IT Career Simulator",
  description:
    "Cyber-Terminal Telegram Mini App for Junior IT career clearance, AI Technical Screening, and Skill Tree matrix.",
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
      <body className="antialiased bg-cyber-black text-cyber-green selection:bg-cyber-green selection:text-cyber-black font-mono">
        {/* Cyber-Terminal Mobile Container */}
        <div className="relative mx-auto w-full max-w-[440px] min-h-dvh bg-cyber-black border-x border-cyber-green/30 flex flex-col shadow-[0_0_40px_rgba(0,255,65,0.08)] cyber-scanlines">
          <TelegramProvider>
            <Toast />
            <TmaHeader />
            <main className="flex-1 px-3.5 pt-3.5 pb-28">{children}</main>
            <BottomNav />
          </TelegramProvider>
        </div>
      </body>
    </html>
  );
}
