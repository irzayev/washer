import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  return (
    <div className="space-y-10 max-w-2xl">
      <header>
        <span className="label-caps text-[10px] text-primary/60 mb-2 block">
          Intelligence · Analytics
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Analytics
        </h1>
        <p className="text-on-surface-variant/60 text-sm">
          Revenue curves, retention, and bay throughput — wire this module to
          your Nest analytics endpoints when ready.
        </p>
      </header>

      <div className="liquid-glass-deep rounded-3xl p-10 text-center">
        <Icon
          name="analytics"
          opsz={40}
          className="text-primary/50 mx-auto mb-4"
        />
        <p className="text-on-surface-variant/70 text-sm mb-6">
          Use the dashboard overview for live KPIs until dedicated charts ship.
        </p>
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "liquid", size: "lg" }),
            "rounded-xl gap-2 inline-flex"
          )}
        >
          <Icon name="dashboard" opsz={18} />
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
