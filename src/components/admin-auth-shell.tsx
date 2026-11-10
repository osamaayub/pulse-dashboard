import Link from "next/link";

export function AdminAuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f5f6fb] px-4 py-6 sm:px-8 sm:py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#e7e8f0] bg-white shadow-[0_24px_80px_-32px_rgba(27,31,59,0.28)] lg:min-h-[640px] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_15%_0%,#6658e8_0%,transparent_42%),linear-gradient(145deg,#191a3e_0%,#26245a_52%,#39328a_100%)] p-10 text-white sm:flex lg:p-12">
          <div className="absolute -right-32 -top-32 size-80 rounded-full border border-white/10" aria-hidden />
          <div className="absolute -right-20 -top-20 size-56 rounded-full border border-white/10" aria-hidden />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-lg font-bold text-[#3d35a3] shadow-lg shadow-black/10">P</span>
              <span>
                <span className="block text-base font-semibold leading-tight">Pulse</span>
                <span className="mt-0.5 block text-xs text-white/60">Commerce intelligence</span>
              </span>
            </Link>
          </div>

          <div className="relative my-12 max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Admin workspace</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.12] tracking-tight">Your business, in focus.</h2>
            <p className="mt-4 max-w-xs text-sm leading-6 text-indigo-100/75">A clearer view of your store starts here. Sign in to manage operations securely.</p>
            <div className="mt-10 rounded-2xl border border-white/15 bg-white/[0.08] p-4 shadow-xl shadow-black/10 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60">Store performance</p>
                  <p className="mt-1 text-xl font-semibold">Live overview</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/15 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-300" /> Secure
                </span>
              </div>
              <div className="mt-5 flex h-16 items-end gap-2" aria-hidden>
                {[30, 45, 37, 62, 48, 72, 58, 88, 70, 100, 79, 94].map((height, index) => (
                  <span key={index} className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-300/30 to-indigo-100/90" style={{ height: `${height}%` }} />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-white/45"><span>Operations</span><span>Inventory</span><span>Analytics</span></div>
            </div>
          </div>

          <p className="relative text-xs text-white/45">Thoughtful tools for the way you work.</p>
        </aside>

        <section className="flex min-w-0 flex-col justify-center px-6 py-9 sm:px-12 sm:py-12 lg:px-14">
          <div className="mb-8 flex items-center gap-3 sm:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white">P</span>
            <span>
              <span className="block text-sm font-semibold">Pulse</span>
              <span className="block text-xs text-muted">Admin workspace</span>
            </span>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-[2rem]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            <div className="mt-7">{children}</div>
            <p className="mt-8 text-center text-xs leading-5 text-muted">
              Protected administrator access · <Link href="/" className="font-medium text-brand hover:underline">Back to dashboard</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
