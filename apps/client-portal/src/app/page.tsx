import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-16 md:py-24">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-[#005bc1]/15 blur-[140px]" />

      <div className="relative mx-auto max-w-3xl space-y-12">
        <header className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/20">
              <span className="material-symbols-outlined text-xl text-primary">water_drop</span>
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-primary">Liquid Detail</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-outline/70">
                Client portal
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="label-caps text-[10px] text-primary/60">Online booking</p>
            <h1 className="text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
              Premium wash &amp; detailing, on your schedule.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant/80">
              Browse services, pick a slot, and track your vehicle. Install to your home screen for a
              lightweight PWA experience.
            </p>
          </div>
        </header>

        <div className="liquid-glass rounded-3xl p-8 md:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-on-surface">Ready when you are</p>
              <p className="mt-1 text-sm text-on-surface-variant/70">
                We confirm appointments via WhatsApp.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="liquid-gradient inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold tracking-wide text-white transition hover:brightness-110"
              >
                View services
              </Link>
              <a
                href="https://wa.me/"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-on-surface transition hover:bg-white/10"
                rel="noreferrer"
              >
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
