"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";

type OrderDetail = {
  id: string;
  branchId: string | null;
  status: string;
  paymentStatus: string;
  subtotalCents: number;
  bonusUsedCents: number;
  finalTotalCents: number;
  discountType: string | null;
  discountValue: number | null;
  client: { id: string; firstName: string | null; lastName: string | null };
  lines: { id: string; qty: number; lineTotalCents: number; service: { name: string } }[];
};

type Branch = { id: string; name: string };

const methods = ["CASH", "POS", "AZERICARD", "BANK_TRANSFER"] as const;

export default function OrderDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bonusAzn, setBonusAzn] = useState(0);
  const [branchId, setBranchId] = useState<string>("");
  const [method, setMethod] = useState<(typeof methods)[number]>("CASH");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    void api<OrderDetail>(`/orders/${id}`)
      .then((o) => {
        setOrder(o);
        setBonusAzn(o.bonusUsedCents / 100);
        setBranchId(o.branchId ?? "");
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void api<Branch[]>("/branches")
      .then(setBranches)
      .catch(() => {});
  }, []);

  const canClose = useMemo(() => {
    if (!order) return false;
    return order.paymentStatus !== "COMPLETED" && order.status !== "DELIVERED";
  }, [order]);

  async function saveBranch() {
    if (!branchId) return;
    setMsg(null);
    setBusy(true);
    try {
      await api(`/orders/${id}`, { method: "PATCH", json: { branchId } });
      setMsg("Branch saved");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function applyBonus() {
    setMsg(null);
    setBusy(true);
    try {
      await api<OrderDetail>(`/orders/${id}`, {
        method: "PATCH",
        json: { bonusUsedCents: Math.round(bonusAzn * 100) },
      }).then(setOrder);
      setMsg("Totals updated");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function closeOrder() {
    if (!order) return;
    setMsg(null);
    setBusy(true);
    try {
      const latest = await api<OrderDetail>(`/orders/${id}`);
      await api(`/orders/${id}/close`, {
        method: "POST",
        json: {
          bonusUsedCents: latest.bonusUsedCents,
          payments: [{ method, amountCents: latest.finalTotalCents }],
        },
      });
      setMsg("Order closed");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!order) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
          <p className="text-sm text-zinc-500 font-mono">{order.id}</p>
          <p className="text-sm text-zinc-600">
            {[order.client.firstName, order.client.lastName].filter(Boolean).join(" ") || "Client"}
          </p>
        </div>
        <Link href="/dashboard/orders" className="text-sm text-zinc-600 underline-offset-4 hover:underline">
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branch</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2 flex-1">
            <Label htmlFor="branch">Assign branch (required to close)</Label>
            <select
              id="branch"
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="">Select…</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="secondary" disabled={busy || !branchId} onClick={() => void saveBranch()}>
            Save branch
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.service.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.qty}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(l.lineTotalCents / 100).toFixed(2)} AZN
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-1 text-sm text-right">
            <div className="flex justify-between">
              <span className="text-zinc-500">Subtotal</span>
              <span className="tabular-nums">{(order.subtotalCents / 100).toFixed(2)} AZN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Bonus used</span>
              <span className="tabular-nums">{(order.bonusUsedCents / 100).toFixed(2)} AZN</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Due</span>
              <span className="tabular-nums">{(order.finalTotalCents / 100).toFixed(2)} AZN</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Close &amp; payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bonus">Bonus to apply (AZN)</Label>
              <Input
                id="bonus"
                type="number"
                min={0}
                step="0.01"
                value={bonusAzn}
                onChange={(e) => setBonusAzn(Number(e.target.value))}
                disabled={!canClose}
              />
              <Button type="button" variant="outline" size="sm" disabled={busy || !canClose} onClick={() => void applyBonus()}>
                Apply bonus &amp; recalculate
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment method</Label>
              <select
                id="method"
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                value={method}
                onChange={(e) => setMethod(e.target.value as (typeof methods)[number])}
                disabled={!canClose}
              >
                {methods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Single tender for the full due in this MVP. Bonuses are applied before payment.
          </p>
          {msg ? <p className="text-sm text-zinc-700">{msg}</p> : null}
          <Button type="button" disabled={busy || !canClose || !order.branchId} onClick={() => void closeOrder()}>
            Close order ({(order.finalTotalCents / 100).toFixed(2)} AZN)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
