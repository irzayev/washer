"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";

type ClientDetail = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  vehicles: { id: string; plate: string | null; make: string | null; model: string | null }[];
  orders: { id: string; status: string; finalTotalCents: number; createdAt: string }[];
};

export default function ClientDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<ClientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api<ClientDetail>(`/clients/${id}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {[data.firstName, data.lastName].filter(Boolean).join(" ") || "Client"}
          </h1>
          <p className="text-sm text-zinc-500">
            {data.phone ?? "—"} · {data.email ?? "—"}
          </p>
        </div>
        <Link href="/dashboard/clients" className="text-sm text-zinc-600 underline-offset-4 hover:underline">
          Back
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate</TableHead>
                <TableHead>Vehicle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.plate ?? "—"}</TableCell>
                  <TableCell>
                    {[v.make, v.model].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">
                    <Link className="underline-offset-4 hover:underline" href={`/dashboard/orders/${o.id}`}>
                      {o.id.slice(0, 8)}…
                    </Link>
                  </TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(o.finalTotalCents / 100).toFixed(2)} AZN
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
