"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type ClientRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  vip: boolean;
};

export default function ClientsPage() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void api<ClientRow[]>("/clients")
      .then(setRows)
      .catch((e: Error) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.firstName, r.lastName, r.phone]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [rows, query]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="label-caps text-[10px] text-primary/60 mb-2 block">
            CRM · Client Portfolio
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
            Client Directory
          </h1>
          <p className="text-on-surface-variant/60 text-sm">
            Managing {rows.length} active portfolio{rows.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Icon name="filter_list" opsz={18} />
            <span className="label-caps text-[11px]">Filters</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Icon name="file_download" opsz={18} />
            <span className="label-caps text-[11px]">Export</span>
          </Button>
          <Button variant="liquid" size="sm" className="gap-2 px-4 h-9 rounded-lg">
            <Icon name="add" opsz={18} />
            <span className="label-caps text-[11px]">New Client</span>
          </Button>
        </div>
      </header>

      {error ? (
        <div className="liquid-glass rounded-3xl p-6 text-sm text-destructive flex items-center gap-2">
          <Icon name="error" opsz={20} />
          {error}
        </div>
      ) : null}

      {/* Search bar */}
      <div className="relative max-w-md">
        <Icon
          name="search"
          opsz={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/40 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
          className="etched-input w-full h-10 rounded-xl pl-11 pr-4 text-sm placeholder:text-outline/40"
        />
      </div>

      {/* Table */}
      <div className="liquid-glass rounded-3xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right pr-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center text-outline/50">
                  <div className="flex flex-col items-center gap-3">
                    <Icon name="group_off" opsz={32} className="text-outline/40" />
                    <p className="text-sm">No clients match.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const fullName =
                  [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";
                const initials =
                  ((c.firstName?.[0] ?? "") + (c.lastName?.[0] ?? "")).toUpperCase() ||
                  "?";
                return (
                  <TableRow key={c.id} className="cursor-pointer group">
                    <TableCell className="py-6">
                      <Link
                        href={`/dashboard/clients/${c.id}`}
                        className="flex items-center gap-4"
                      >
                        <span className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center font-bold text-primary border border-primary/10 text-xs">
                          {initials}
                        </span>
                        <span className="flex flex-col">
                          <span className="font-bold text-on-surface">
                            {fullName}
                          </span>
                          <span className="text-outline/60 text-xs">
                            {c.phone ?? "no phone"}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-on-surface-variant">
                        {c.phone ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {c.vip ? (
                        <Badge variant="platinum">VIP</Badge>
                      ) : (
                        <Badge variant="silver">Standard</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Link
                        href={`/dashboard/clients/${c.id}`}
                        className="inline-flex items-center justify-end text-outline/30 group-hover:text-primary transition-colors"
                        aria-label="Open profile"
                      >
                        <Icon name="arrow_forward_ios" opsz={18} />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
