"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { API_BASE } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@edetailing.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Caustic blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-[#005bc1]/15 blur-[140px]" />

      <div className="relative w-full max-w-md liquid-glass-deep rounded-3xl p-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-11 h-11 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0">
            <Icon name="water_drop" className="text-primary" opsz={22} weight={500} />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary leading-tight">
              Liquid Detail
            </h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-outline/60 font-semibold">
              Elite Systems
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-on-surface-variant/60">
            Sign in to the operations workspace.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="label-caps text-[10px] text-outline/70"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="label-caps text-[10px] text-outline/70"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <div className="flex items-start gap-2 text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-xl px-4 py-3">
              <Icon name="error" opsz={18} className="mt-0.5 shrink-0" />
              <span className="break-all">{error}</span>
            </div>
          ) : null}

          <Button
            type="submit"
            variant="liquid"
            className="w-full h-11 rounded-xl text-sm gap-2"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Continue"}
            {!loading && <Icon name="arrow_forward" opsz={18} />}
          </Button>
        </form>

        <p className="mt-8 text-[10px] text-center text-outline/40 font-bold uppercase tracking-widest">
          Operations · Authorized Access Only
        </p>
      </div>
    </div>
  );
}
