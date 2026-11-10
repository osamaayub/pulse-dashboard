import { redirect } from "next/navigation";
import { isAdminAuthConfigured } from "@auth";
import { currentAdminEmail } from "@/server/admin-auth";
import { adminSignOut } from "../sign-out";
import { AdminSectionNav } from "./section-nav";

export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!isAdminAuthConfigured()) redirect("/admin/sign-in?setup=required");
  const email = await currentAdminEmail();
  if (!email) redirect("/admin/sign-in");
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line/80 bg-white p-4 shadow-[0_8px_24px_-20px_rgba(13,19,36,0.3)] sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand" aria-hidden>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7l-8-4Z" /><path d="m9 12 2 2 4-4" /></svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">Store administration</p>
            <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
          </div>
        </div>
        <form action={adminSignOut}>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium transition hover:border-[#c9cce0] hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M10 17l5-5-5-5M15 12H3m9-8h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" /></svg>
            Sign out
          </button>
        </form>
      </header>
      <AdminSectionNav />
      {children}
    </div>
  );
}
