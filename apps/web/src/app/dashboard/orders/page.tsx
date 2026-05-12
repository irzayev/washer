"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type OrderRow = {
  id: string;
  status: string;
  paymentStatus: string;
  finalTotalCents: number;
  client: { firstName: string | null; lastName: string | null };
};

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api<OrderRow[]>("/orders")
      .then(setRows)
      .catch((e: Error) => setError(e.message));
  }, []);

  const summary = computeSummary(rows);

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="label-caps text-[10px] text-primary/60 mb-2 block">
            Operations · Work Orders
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
            Work Orders
          </h1>
          <p className="text-on-surface-variant/60 text-sm">
            Current queue and active treatments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Icon name="filter_list" opsz={18} />
            <span className="label-caps text-[11px]">Filter</span>
          </Button>
          <Button variant="liquid" size="sm" className="gap-2 px-4 h-9 rounded-lg">
            <Icon name="add" opsz={18} />
            <span className="label-caps text-[11px]">New Order</span>
          </Button>
        </div>
      </header>

      {error ? (
        <div className="liquid-glass rounded-3xl p-6 text-sm text-destructive flex items-center gap-2">
          <Icon name="error" opsz={20} />
          {error}
        </div>
      ) : null}

      {/* Summary cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          label="Active Orders"
          value={summary.active}
          accent={`+${summary.todayDelta} today`}
          progress={summary.activePercent}
          tone="primary"
        />
        <SummaryCard
          label="Awaiting Payment"
          value={summary.awaiting}
          accent="Vehicles waiting"
          progress={summary.awaitingPercent}
          tone="muted"
        />
        <SummaryCard
          label="Daily Revenue"
          value={`${summary.revenueAzn.toLocaleString()} ₼`}
          accent="REACHED"
          progress={summary.revenuePercent}
          tone="primary"
          highlight
        />
      </section>

      {/* Table */}
      <div className="liquid-glass rounded-3xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !error ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-outline/50">
                  <div className="flex flex-col items-center gap-3">
                    <Icon name="receipt_long" opsz={32} className="text-outline/40" />
                    <p className="text-sm">No active work orders.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((o) => (
                <TableRow key={o.id} className="group">
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="text-outline group-hover:text-primary transition-colors font-medium"
                    >
                      #{o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {[o.client.firstName, o.client.lastName].filter(Boolean).join(" ") ||
                        "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={o.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-on-surface">
                    {(o.finalTotalCents / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ₼
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "primary" | "outline" | "success" | "warning"; label: string; dot?: string }> = {
    NEW: { variant: "outline", label: "New", dot: "bg-outline" },
    BOOKED: { variant: "outline", label: "Booked", dot: "bg-outline" },
    IN_PROGRESS: { variant: "primary", label: "In Progress", dot: "bg-primary" },
    WAITING: { variant: "warning", label: "Waiting", dot: "bg-orange-400" },
    COMPLETED: { variant: "success", label: "Completed", dot: "bg-emerald-400" },
    DELIVERED: { variant: "success", label: "Delivered", dot: "bg-emerald-400" },
  };
  const cfg = map[status] ?? { variant: "outline" as const, label: status, dot: "bg-outline" };
  return (
    <Badge variant={cfg.variant}>
      <span className={cn("w-1 h-1 rounded-full", cfg.dot)} />
      {cfg.label}
    </Badge>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "outline" | "danger"> = {
    PAID: "success",
    UNPAID: "warning",
    PARTIAL: "warning",
    REFUNDED: "outline",
    FAILED: "danger",
  };
  return <Badge variant={map[status] ?? "outline"}>{status.toLowerCase()}</Badge>;
}

function SummaryCard({
  label,
  value,
  accent,
  progress,
  tone,
  highlight,
}: {
  label: string;
  value: string | number;
  accent: string;
  progress: number;
  tone: "primary" | "muted";
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "liquid-glass rounded-3xl p-7 relative overflow-hidden",
        highlight && "bg-primary/5"
      )}
    >
      <div className="relative z-10">
        <p
          className={cn(
            "text-[10px] uppercase tracking-widest font-bold mb-3",
            highlight ? "text-primary" : "text-outline/60"
          )}
        >
          {label}
        </p>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
            {value}
          </span>
          <span
            className={cn(
              "text-xs font-semibold",
              tone === "primary" ? "text-primary" : "text-outline"
            )}
          >
            {accent}
          </span>
        </div>
        <div className="mt-5 h-px w-full bg-white/5">
          <div
            className={cn(
              "h-full",
              tone === "primary" ? "bg-primary" : "bg-outline/40"
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function computeSummary(rows: OrderRow[]) {
  const active = rows.filter((r) =>
    ["NEW", "BOOKED", "IN_PROGRESS", "WAITING"].includes(r.status)
  ).length;
  const awaiting = rows.filter((r) => r.paymentStatus !== "PAID").length;
  const revenueCents = rows
    .filter((r) => r.paymentStatus === "PAID")
    .reduce((sum, r) => sum + r.finalTotalCents, 0);
  const revenueAzn = Math.round(revenueCents / 100);
  return {
    active,
    awaiting,
    todayDelta: Math.min(active, 5),
    activePercent: Math.min(100, active * 8),
    awaitingPercent: Math.min(100, awaiting * 8),
    revenueAzn,
    revenuePercent: Math.min(100, Math.round(revenueAzn / 50)),
  };
}
