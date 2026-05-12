"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/dashboard/settings/services",
    label: "Services & Pricing",
    icon: "settings_suggest",
  },
  {
    href: "/dashboard/settings/payroll",
    label: "Payroll",
    icon: "payments",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-10">
      <header>
        <span className="label-caps text-[10px] text-primary/60 mb-2 block">
          Workspace · Configuration
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
          Settings
        </h1>
        <p className="text-on-surface-variant/60 text-sm">
          Configure service catalog, pricing, and salary models.
        </p>
      </header>

      <div className="liquid-glass inline-flex p-1 rounded-2xl gap-1">
        {tabs.map((t) => {
          const active =
            pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-outline/60 hover:text-primary hover:bg-white/5"
              )}
            >
              <Icon name={t.icon} opsz={18} />
              {t.label}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
