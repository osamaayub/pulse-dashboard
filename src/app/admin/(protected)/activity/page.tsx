import { Panel } from "@/components/ui";
import { recentAdminActivity } from "@/features/admin/queries";
import { longDate } from "@/lib/format";

export const metadata = { title: "Admin activity" };

export default async function AdminActivityPage() {
  const rows = await recentAdminActivity();
  return (
    <>
      <header><h1 className="text-2xl font-semibold tracking-tight">Administrator activity</h1><p className="mt-1 text-sm text-muted">Recent product, stock, order and customer changes. Activity entries are retained for accountability.</p></header>
      <Panel title={`Latest activity · ${rows.length}`}>
        {!rows.length ? <p className="py-12 text-center text-sm text-muted">No admin changes have been recorded yet.</p> : (
          <ol className="divide-y divide-line">
            {rows.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0"><p className="text-sm">{entry.summary}</p><p className="mt-1 text-xs text-muted">{entry.actorEmail} · {entry.action} · {entry.entityType} #{entry.entityId}</p></div>
                <time dateTime={entry.createdAt.toISOString()} className="shrink-0 text-xs text-muted">{longDate(entry.createdAt)}</time>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}
