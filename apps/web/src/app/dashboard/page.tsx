"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Dashboard = {
  ordersInProgress: number;
  revenueLast30dCents: number;
};

type StatTone = "primary" | "success" | "warning";

type Stat = {
  label: string;
  value: string;
  hint: string;
  hintTone: StatTone;
  icon: string;
  progress: number;
  tone: StatTone;
};

const TONE_STYLES: Record<StatTone, { text: string; bar: string }> = {
  primary: { text: "text-primary", bar: "bg-primary/40" },
  success: { text: "text-emerald-300", bar: "bg-emerald-400/40" },
  warning: { text: "text-orange-300", bar: "bg-orange-400/40" },
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api<Dashboard>("/analytics/dashboard")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="liquid-glass rounded-3xl p-8 text-sm text-destructive">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="error" opsz={20} />
          <span className="font-semibold">Telemetry offline</span>
        </div>
        <p className="text-destructive/80">{error}</p>
      </div>
    );
  }

  const stats: Stat[] = data
    ? [
        {
          label: "Revenue (30d)",
          value: formatMoney(data.revenueLast30dCents),
          hint: "+12.5%",
          hintTone: "success",
          icon: "payments",
          progress: 75,
          tone: "primary",
        },
        {
          label: "Orders In Progress",
          value: String(data.ordersInProgress),
          hint: `${data.ordersInProgress} ACTIVE`,
          hintTone: "primary",
          icon: "directions_car",
          progress: Math.min(100, data.ordersInProgress * 8),
          tone: "primary",
        },
        {
          label: "Client CSAT",
          value: "4.98",
          hint: "ELITE",
          hintTone: "primary",
          icon: "grade",
          progress: 98,
          tone: "primary",
        },
        {
          label: "Avg Lead Time",
          value: "4.2d",
          hint: "RISING",
          hintTone: "warning",
          icon: "schedule",
          progress: 65,
          tone: "warning",
        },
      ]
    : [];

  return (
    <div className="space-y-14">
      {/* Welcome — matches Stitch dashboard welcome row */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">
            Operational Intelligence
          </h1>
          <p className="text-on-surface-variant/60 text-sm max-w-xl">
            Real-time telemetry for the main detailing floor.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10 self-start md:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            System Live
          </span>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-4">
        {data
          ? stats.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStat key={i} />
            ))}
      </section>

      {/* Two-column section: Revenue + Live Feed */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 liquid-glass-deep rounded-3xl p-8 md:p-10">
          <div className="flex items-center justify-between mb-10 md:mb-12">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Revenue Trends</h2>
              <p className="text-on-surface-variant/50 text-xs mt-1">
                Weekly performance by service tier
              </p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          {/* Mini bar chart */}
          <div className="relative h-72 w-full flex items-end gap-3 px-2">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="h-px w-full bg-white/10" />
              <div className="h-px w-full bg-white/10" />
              <div className="h-px w-full bg-white/10" />
              <div className="h-px w-full bg-white/20" />
            </div>
            {[40, 55, 45, 70, 90, 85, 60].map((h, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-t-xl transition-all duration-300",
                  i === 5
                    ? "bg-primary/40"
                    : "bg-primary/10 hover:bg-primary/30"
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-8 text-outline/40 font-bold text-[10px] tracking-widest uppercase px-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>

        <div className="liquid-glass-deep rounded-3xl p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <Icon name="sensors" filled opsz={20} className="text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Live Feed</h2>
          </div>

          <ul className="space-y-7 flex-1 overflow-y-auto max-h-[420px] pr-3 custom-scrollbar">
            {LIVE_FEED.map((event, i) => (
              <li
                key={i}
                className="relative pl-6 border-l border-white/5"
              >
                <span
                  className={cn(
                    "absolute left-[-4px] top-1.5 w-2 h-2 rounded-full",
                    event.tone === "success" && "bg-emerald-400",
                    event.tone === "primary" && "bg-primary",
                    event.tone === "warning" && "bg-orange-400",
                    event.tone === "muted" && "bg-emerald-400/50"
                  )}
                />
                <p className="text-xs font-bold text-on-surface">
                  {event.title}
                </p>
                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">
                  {event.subtitle}
                </p>
                <span className="text-[9px] text-outline/40 mt-1.5 block uppercase tracking-wider">
                  {event.time}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-8 w-full py-3 text-[10px] font-bold text-primary/70 hover:text-primary hover:bg-white/5 rounded-xl transition-all uppercase tracking-widest"
          >
            History
          </button>
        </div>
      </section>

      {/* Studio Overview — Stitch dashboard bay grid */}
      <section className="mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">
            Studio Overview
          </h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="text-[10px] font-bold text-outline/60 uppercase tracking-widest">
                In-Progress
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60" />
              <span className="text-[10px] font-bold text-outline/60 uppercase tracking-widest">
                Curing
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
          {STUDIO_BAYS.map((bay) => (
            <article
              key={bay.id}
              className="liquid-glass rounded-3xl overflow-hidden group hover:bg-white/5 transition-all duration-500"
            >
              <div className="relative h-56 overflow-hidden bg-surface-container-high/40">
                <Image
                  src={bay.image}
                  alt={bay.alt}
                  fill
                  className="object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute top-5 left-5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5">
                  <span className="text-[9px] font-bold text-white tracking-widest">
                    {bay.id}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-1 gap-3">
                  <h3 className="font-bold text-on-surface">{bay.vehicle}</h3>
                  <span
                    className={cn(
                      "text-[9px] font-bold tracking-widest uppercase shrink-0",
                      bay.statusTone === "orange" && "text-orange-400",
                      bay.statusTone === "primary" && "text-primary"
                    )}
                  >
                    {bay.status}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant/50">{bay.detail}</p>
                <div className="mt-6 h-px w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      bay.barTone === "orange" ? "bg-orange-400/40" : "bg-primary/40"
                    )}
                    style={{ width: `${bay.progress}%` }}
                  />
                </div>
              </div>
            </article>
          ))}

          <Link
            href="/dashboard/orders"
            className="rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center p-10 min-h-[280px] group cursor-pointer hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-500"
          >
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-outline/30 group-hover:text-primary group-hover:border-primary/30 transition-all mb-4">
              <Icon name="add" opsz={22} />
            </div>
            <p className="text-[10px] font-bold text-outline/40 group-hover:text-primary transition-all uppercase tracking-[0.2em]">
              Assign Bay 04
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  const tone = TONE_STYLES[stat.tone];
  const hintTone = TONE_STYLES[stat.hintTone];
  return (
    <div className="liquid-glass p-8 rounded-3xl hover:bg-white/5 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <Icon name={stat.icon} opsz={24} className="text-primary/60" />
        <span className={cn("text-[10px] font-bold tracking-wide", hintTone.text)}>
          {stat.hint}
        </span>
      </div>
      <p className="text-outline/60 text-[10px] font-bold uppercase tracking-widest mb-1">
        {stat.label}
      </p>
      <p className="text-2xl font-bold text-on-surface tracking-tight">
        {stat.value}
      </p>
      <div className="mt-6 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full", tone.bar)} style={{ width: `${stat.progress}%` }} />
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="liquid-glass p-7 rounded-3xl animate-pulse">
      <div className="flex justify-between items-start mb-5">
        <div className="w-6 h-6 rounded bg-white/5" />
        <div className="w-10 h-3 rounded bg-white/5" />
      </div>
      <div className="w-24 h-3 rounded bg-white/5 mb-3" />
      <div className="w-32 h-7 rounded bg-white/10" />
      <div className="mt-5 h-px w-full bg-white/5" />
    </div>
  );
}

function formatMoney(cents: number) {
  return `${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₼`;
}

/** Decorative bay imagery — same sources as Stitch HTML export */
const STUDIO_BAYS = [
  {
    id: "BAY 01",
    vehicle: "Ferrari F8 Tributo",
    status: "Coating",
    statusTone: "primary" as const,
    detail: "Stage 3 Ceramic • 65%",
    progress: 65,
    barTone: "primary" as const,
    alt: "Detailing bay — sports car",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHcuDtLO-i0Hx2Pw8JV39y8dmTKgKhuQTZK6aYD86iDVCZWKS1fVUg_17s7Fi2uFH3OhGN3PwE24etI9fp3nk0KiRoxg6Fl03e4ElGkuptEw8WNL23v8Esirew_RBknwHzDT17BD_J_qzZlE3cJ7x82elWQAGMzqOMUgYL8tXuFd3kecmkbk3K26YR8JA8pqq8EHtDR2pHJ5akhZtkf7yV79Ns6FFKyAuDXAxRFo4TRrzrL_LkcA74JotdwFdBxpuy-Bs3Ay2QaA",
  },
  {
    id: "BAY 02",
    vehicle: "Porsche 911 S",
    status: "Curing",
    statusTone: "orange" as const,
    detail: "Glass Coating V2 • 2h left",
    progress: 40,
    barTone: "orange" as const,
    alt: "Detailing bay — Porsche",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCkoIUwTJcvaa2bjWjz_IYVCJEVEPRMDv60gBc2N1ao4Fm58sTEfUbuU1vG9K1NT9ft-YBq5Ugx1vLFb3QW9XrSdWfq-ZgDH3QuvKljI93rS5QRROCkyyvrCUrTuLF0h8gq3O27vAR_hQT1eoFvattVtcvm92uOxgS0mCEM9_GuCQwcbmhBsGQVp2dAJAkdgzEtl8kA6nHV5PcHLnhcoYxtviXSL8Oggc1qPHvPze-_inJpduC7SmWDZfSltL0jXEgW6p3JWVzrTA",
  },
  {
    id: "BAY 03",
    vehicle: "Range Rover SV",
    status: "Polishing",
    statusTone: "primary" as const,
    detail: "Paint Correction • 90%",
    progress: 90,
    barTone: "primary" as const,
    alt: "Detailing bay — SUV",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCWLibOZyKaL0tEXcf9GKmwG-JfMDGsbf-1XojOxuWCg0-g2jcQBivnqV1j47EsILZAoXjG32BtIlP9GxpbOzeE5Dc0JDTADtR94f63vphmbFS633tx2C1jsqSNc8SrvwAU_waVEq5XTUG6_HxoEAqSK5-YVNx9yYtNeDfHcs04IbHJKuX5zHB590iFqhrr6Gr-N6PwZW0Hs9y1tmFkogflEgzJh5VprOQKJybmFOP5LlB8vlcKaf0BpD2CvdBSRCRPtqYo8FTwqQ",
  },
] as const;

const LIVE_FEED = [
  {
    title: "Bay 04 QC Passed",
    subtitle: "2023 Porsche 911 GT3 (Chalk)",
    time: "2 mins ago",
    tone: "success" as const,
  },
  {
    title: "Service Initiated",
    subtitle: "Tesla Model S Plaid · L2 Correction",
    time: "15 mins ago",
    tone: "primary" as const,
  },
  {
    title: "Chemical Alert",
    subtitle: "Ceramic Sealant V3 at 15%",
    time: "45 mins ago",
    tone: "warning" as const,
  },
  {
    title: "Payment Received",
    subtitle: "Invoice #8829 · $2,450.00",
    time: "1 hour ago",
    tone: "muted" as const,
  },
];
