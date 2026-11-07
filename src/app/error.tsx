"use client";

/** Shown when a page fails on the server (usually the database). */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <h1 className="text-2xl font-semibold">The dashboard couldn&apos;t load its data</h1>
      <p className="mt-3 text-sm text-muted">This is usually the database connection. Open <a className="font-medium text-brand underline" href="/api/health">/api/health</a> to see the exact reason.</p>
      <button onClick={reset} className="mt-6 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-brand">Try again</button>
    </div>
  );
}
