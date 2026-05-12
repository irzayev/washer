"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";

type Role = "ADMIN" | "MANAGER" | "WORKER" | "CLIENT";
type PayrollModel = "FIXED" | "PERCENT" | "PERCENT_BONUS" | "KPI";

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
};

type PayrollProfile = {
  id: string;
  userId: string;
  model: PayrollModel;
  baseCents: number | null;
  percentBp: number | null;
  notes: string | null;
};

const MODELS: { value: PayrollModel; label: string; hint: string }[] = [
  { value: "FIXED", label: "Fixed salary", hint: "Flat monthly amount." },
  { value: "PERCENT", label: "Percent of revenue", hint: "% of completed orders." },
  { value: "PERCENT_BONUS", label: "Base + percent", hint: "Fixed base plus a percent." },
  { value: "KPI", label: "KPI-based", hint: "Manual / KPI-driven payouts." },
];

function formatName(u: User) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

export default function PayrollSettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<PayrollProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api<User[]>("/users"),
      api<(PayrollProfile & { user: User })[]>("/payroll/profiles"),
    ])
      .then(([u, p]) => {
        setUsers(u);
        setProfiles(p);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const profileByUser = useMemo(() => {
    const map = new Map<string, PayrollProfile>();
    for (const p of profiles) map.set(p.userId, p);
    return map;
  }, [profiles]);

  const eligible = useMemo(
    () => users.filter((u) => u.role !== "CLIENT" && u.isActive),
    [users],
  );

  async function save(
    user: User,
    patch: { model: PayrollModel; baseCents?: number | null; percentBp?: number | null; notes?: string | null },
  ) {
    setSavingId(user.id);
    setError(null);
    try {
      await api(`/payroll/profiles/${user.id}`, {
        method: "POST",
        json: {
          model: patch.model,
          baseCents: patch.baseCents ?? undefined,
          percentBp: patch.percentBp ?? undefined,
          notes: patch.notes ?? undefined,
        },
      });
      setSavedId(user.id);
      setTimeout(() => setSavedId((id) => (id === user.id ? null : id)), 1500);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compensation models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((m) => (
              <div
                key={m.value}
                className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3"
              >
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-zinc-500 mt-1">{m.hint}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            <strong>Base</strong> — fixed monthly amount in AZN. <strong>Percent</strong> — share of
            revenue, entered as % (stored as basis points; e.g. 12.5% = 1250 bp).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Base (AZN)</TableHead>
                <TableHead className="text-right">Percent (%)</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Save</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-zinc-500 py-6">
                    No active staff users yet.
                  </TableCell>
                </TableRow>
              ) : (
                eligible.map((u) => (
                  <PayrollRow
                    key={u.id}
                    user={u}
                    profile={profileByUser.get(u.id) ?? null}
                    saving={savingId === u.id}
                    saved={savedId === u.id}
                    onSave={(patch) => void save(u, patch)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PayrollRow({
  user,
  profile,
  saving,
  saved,
  onSave,
}: {
  user: User;
  profile: PayrollProfile | null;
  saving: boolean;
  saved: boolean;
  onSave: (patch: {
    model: PayrollModel;
    baseCents: number | null;
    percentBp: number | null;
    notes: string | null;
  }) => void;
}) {
  const [model, setModel] = useState<PayrollModel>(profile?.model ?? "FIXED");
  const [baseAzn, setBaseAzn] = useState<string>(
    profile?.baseCents != null ? (profile.baseCents / 100).toFixed(2) : "",
  );
  const [percent, setPercent] = useState<string>(
    profile?.percentBp != null ? (profile.percentBp / 100).toString() : "",
  );
  const [notes, setNotes] = useState<string>(profile?.notes ?? "");

  useEffect(() => {
    setModel(profile?.model ?? "FIXED");
    setBaseAzn(profile?.baseCents != null ? (profile.baseCents / 100).toFixed(2) : "");
    setPercent(profile?.percentBp != null ? (profile.percentBp / 100).toString() : "");
    setNotes(profile?.notes ?? "");
  }, [profile]);

  const showBase = model === "FIXED" || model === "PERCENT_BONUS" || model === "KPI";
  const showPercent = model === "PERCENT" || model === "PERCENT_BONUS";

  function handleSave() {
    const baseCents = baseAzn === "" ? null : Math.round(Number(baseAzn) * 100);
    const percentBp = percent === "" ? null : Math.round(Number(percent) * 100);
    if (showBase && baseCents !== null && (!Number.isFinite(baseCents) || baseCents < 0)) return;
    if (showPercent && percentBp !== null && (!Number.isFinite(percentBp) || percentBp < 0)) return;
    onSave({
      model,
      baseCents: showBase ? baseCents : null,
      percentBp: showPercent ? percentBp : null,
      notes: notes.trim() ? notes.trim() : null,
    });
  }

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{formatName(user)}</div>
        <div className="text-xs text-zinc-500">{user.email}</div>
      </TableCell>
      <TableCell>
        <span className="text-xs uppercase tracking-wide text-zinc-500">{user.role}</span>
      </TableCell>
      <TableCell>
        <select
          aria-label="Payroll model"
          className="flex h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          value={model}
          onChange={(e) => setModel(e.target.value as PayrollModel)}
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={baseAzn}
          onChange={(e) => setBaseAzn(e.target.value)}
          disabled={!showBase}
          className="h-8 text-right tabular-nums"
          placeholder={showBase ? "0.00" : "—"}
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={0}
          step="0.1"
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          disabled={!showPercent}
          className="h-8 text-right tabular-nums"
          placeholder={showPercent ? "0" : "—"}
        />
      </TableCell>
      <TableCell>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          className="h-8"
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {saved ? <span className="text-xs text-emerald-600">Saved</span> : null}
          <Button type="button" size="sm" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
