import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
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
      <body className="min-h-dvh font-sans lg:grid lg:grid-cols-[248px_1fr]">
        <Sidebar resetHours={demoResetHours} />
        <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-8">{children}</main>
      </body>
    </html>
  );
}
