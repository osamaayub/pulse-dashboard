import { Suspense } from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppFrame } from "@/components/app-frame";
import { Sidebar } from "@/components/sidebar";
import { demoResetHours } from "@/server/env";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pulse: Store Analytics Dashboard", template: "%s | Pulse" },
  description: "An admin dashboard for an online store, built with Next.js 16, Postgres, Drizzle and Recharts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <Suspense fallback={
          <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
            <Sidebar resetHours={demoResetHours} />
            <main className="min-w-0 px-4 pt-6 pb-24 sm:px-8 sm:pt-8 sm:pb-24 lg:py-8">{children}</main>
          </div>
        }>
          <AppFrame resetHours={demoResetHours}>{children}</AppFrame>
        </Suspense>
      </body>
    </html>
  );
}
