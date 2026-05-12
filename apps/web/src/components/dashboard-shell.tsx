"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getAccessToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type Me = {
  userId: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "WORKER" | "CLIENT";
  branchId: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles?: Me["role"][];
  external?: boolean;
};

const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/clients", label: "CRM", icon: "group" },
  { href: "/dashboard/orders", label: "Orders", icon: "shopping_cart" },
  { href: "/dashboard/settings/services", label: "Services", icon: "settings_suggest" },
  { href: "/dashboard/inventory", label: "Inventory", icon: "inventory_2" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "analytics" },
  { href: "/dashboard/settings/payroll", label: "Payroll", icon: "payments", roles: ["ADMIN"] },
];

const secondaryNav: NavItem[] = [
  {
    href: "mailto:support@liquiddetail.local",
    label: "Support",
    icon: "contact_support",
    external: true,
  },
  { href: "/dashboard/settings", label: "Account", icon: "account_circle", roles: ["ADMIN"] },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    void api<Me>("/auth/me")
      .then(setMe)
      .catch(() => router.replace("/login"));
  }, [router]);

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.replace("/login");
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-outline/60">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
          Loading workspace…
        </div>
      </div>
    );
  }

  const isVisible = (item: NavItem) =>
    !item.roles || item.roles.includes(me.role);
  const visiblePrimary = primaryNav.filter(isVisible);
  const visibleSecondary = secondaryNav.filter(isVisible);

  const initials =
    me.email
      .split("@")[0]
      ?.split(/[._-]/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="min-h-screen text-on-surface">
      {/* Sidebar — desktop */}
      <nav
        aria-label="Primary"
        className="liquid-sidebar fixed left-0 top-0 hidden md:flex h-screen w-64 z-50 flex-col py-10 border-r border-white/5"
      >
        <Link href="/dashboard" className="px-8 mb-12 flex items-center gap-3 group">
          <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0">
            <Icon name="water_drop" className="text-primary text-xl" opsz={20} weight={500} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold text-primary tracking-tight">Liquid Detail</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-outline/60 font-semibold">
              Elite Systems
            </span>
          </span>
        </Link>

        <div className="flex-1 px-4 space-y-1">
          {visiblePrimary.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant/70 hover:text-primary hover:bg-white/5"
                )}
              >
                <Icon
                  name={item.icon}
                  filled={active}
                  opsz={20}
                  className={cn(
                    "transition-transform duration-200 group-hover:translate-x-0.5",
                    active ? "text-primary" : "text-outline/70"
                  )}
                />
                <span className="text-sm font-medium tracking-tight">{item.label}</span>
                {active && (
                  <span className="ml-auto w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(173,198,255,0.5)]" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="px-6 mt-auto">
          <Button
            variant="liquid"
            className="w-full h-11 rounded-xl text-sm font-bold tracking-wide gap-2 py-3.5"
            onClick={() => router.push("/dashboard/orders")}
          >
            <Icon name="add" opsz={20} />
            New Order
          </Button>
        </div>

        <div className="mt-10 px-6 space-y-4">
          {visibleSecondary.map((item) => {
            const active =
              !item.external && pathname.startsWith(item.href.split("?")[0]);
            const className = cn(
              "flex items-center gap-3 text-xs font-medium transition-colors",
              active
                ? "text-primary"
                : "text-outline/60 hover:text-primary"
            );
            const inner = (
              <>
                <Icon name={item.icon} opsz={18} />
                <span>{item.label}</span>
              </>
            );
            return item.external ? (
              <a
                key={item.href}
                href={item.href}
                className={className}
              >
                {inner}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={className}>
                {inner}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Top bar */}
      <header className="liquid-topbar fixed top-0 right-0 left-0 md:left-64 flex justify-between items-center h-20 px-6 md:px-10 z-40 border-b border-white/5">
        <div className="flex items-center flex-1 max-w-lg">
          <div className="relative w-full">
            <Icon
              name="search"
              opsz={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/40 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search operational data…"
              className="etched-input w-full py-2.5 h-auto rounded-xl pl-12 pr-4 text-sm placeholder:text-outline/30"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2 text-on-surface-variant/60">
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-white/5 hover:text-primary transition-colors"
              aria-label="Notifications"
            >
              <Icon name="notifications" opsz={20} />
            </button>
            {me.role === "ADMIN" ? (
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/5 hover:text-primary transition-colors"
                aria-label="Settings"
                onClick={() => router.push("/dashboard/settings")}
              >
                <Icon name="settings" opsz={20} />
              </button>
            ) : null}
          </div>
          <span className="hidden md:block h-6 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block leading-tight">
              <p className="text-xs font-semibold text-on-surface tracking-tight">
                {me.email.split("@")[0]}
              </p>
              <p className="text-[9px] text-outline/60 font-bold uppercase tracking-widest">
                {me.role}
              </p>
            </div>
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center font-bold text-primary text-sm hover:border-primary/40 transition-colors"
              aria-label="Account"
            >
              {initials}
            </button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <Icon name="logout" opsz={18} />
              <span className="hidden lg:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="md:ml-64 pt-32 pb-24 md:pb-20 px-4 sm:px-8 lg:px-10 xl:px-16 max-w-[1600px] mx-auto">
        {children}
      </main>

      {/* Mobile bottom nav — Stitch: center FAB for quick new order */}
      <nav
        aria-label="Mobile primary"
        className="md:hidden fixed bottom-0 left-0 right-0 h-20 z-50 px-6 flex items-center justify-around bg-surface-container/60 backdrop-blur-3xl border-t border-white/5"
      >
        {visiblePrimary.slice(0, 2).map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-colors min-w-0",
                active ? "text-primary" : "text-outline/50"
              )}
            >
              <Icon name={item.icon} filled={active} opsz={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider truncate max-w-[4.5rem]">
                {item.href === "/dashboard" ? "Dash" : item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          className="w-14 h-14 -mt-10 shrink-0 rounded-2xl liquid-gradient text-white flex items-center justify-center shadow-lg shadow-[#005bc1]/30"
          onClick={() => router.push("/dashboard/orders")}
          aria-label="New order"
        >
          <Icon name="add" opsz={24} className="text-white" />
        </button>
        <Link
          href="/dashboard/inventory"
          className={cn(
            "flex flex-col items-center gap-1.5 transition-colors min-w-0",
            pathname.startsWith("/dashboard/inventory")
              ? "text-primary"
              : "text-outline/50"
          )}
        >
          <Icon
            name="inventory_2"
            filled={pathname.startsWith("/dashboard/inventory")}
            opsz={20}
          />
          <span className="text-[9px] font-bold uppercase tracking-wider">Stock</span>
        </Link>
        <Link
          href={me.role === "ADMIN" ? "/dashboard/settings" : "/dashboard"}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-colors min-w-0",
            me.role === "ADMIN" && pathname.startsWith("/dashboard/settings")
              ? "text-primary"
              : "text-outline/50"
          )}
        >
          <Icon
            name="account_circle"
            filled={
              me.role === "ADMIN" && pathname.startsWith("/dashboard/settings")
            }
            opsz={20}
          />
          <span className="text-[9px] font-bold uppercase tracking-wider">User</span>
        </Link>
      </nav>
    </div>
  );
}
