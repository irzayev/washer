import Link from "next/link";
import { fetchJson } from "@/lib/api";

export const dynamic = "force-dynamic";

type Service = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMin: number | null;
  category: { name: string };
};

export default async function BookPage() {
  const services = await fetchJson<Service[]>("/catalog/services");

  return (
    <div className="relative min-h-screen px-6 py-12 md:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="relative mx-auto max-w-3xl space-y-10">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-outline/70 transition hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Home
          </Link>
          <div>
            <p className="label-caps mb-2 text-[10px] text-primary/60">Catalog</p>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
              Book a service
            </h1>
            <p className="mt-2 max-w-xl text-on-surface-variant/75">
              Browse packages and request your visit. A manager will confirm via WhatsApp.
            </p>
          </div>
        </div>

        <ul className="space-y-4">
          {services.map((s) => (
            <li key={s.id} className="liquid-glass rounded-3xl p-6 transition hover:bg-white/[0.03]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="label-caps text-[10px] text-outline/80">{s.category.name}</p>
                  <h2 className="text-lg font-semibold tracking-tight text-on-surface">{s.name}</h2>
                  {s.description ? (
                    <p className="text-sm leading-relaxed text-on-surface-variant/80">{s.description}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold tabular-nums text-primary">
                    {(s.priceCents / 100).toFixed(0)} AZN
                  </p>
                  {s.durationMin ? (
                    <p className="mt-1 text-xs text-outline/70">{s.durationMin} min</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
