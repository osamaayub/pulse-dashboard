"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function AppFrame({ children, resetHours }: { children: React.ReactNode; resetHours: number }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/admin/sign-in" || pathname === "/admin/invite";

  return (
    <div className={isAuthPage ? "min-h-dvh" : "min-h-dvh lg:grid lg:grid-cols-[248px_1fr]"}>
      {!isAuthPage && <Sidebar resetHours={resetHours} />}
      <main className={isAuthPage ? "min-h-dvh min-w-0" : "min-w-0 px-4 pt-6 pb-24 sm:px-8 sm:pt-8 sm:pb-24 lg:py-8"}>
        {children}
      </main>
    </div>
  );
}
