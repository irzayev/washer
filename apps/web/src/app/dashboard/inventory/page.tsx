import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  return (
    <div className="space-y-10 max-w-2xl">
      <header>
        <span className="label-caps text-[10px] text-primary/60 mb-2 block">
          Operations · Stock
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Inventory
        </h1>
        <p className="text-on-surface-variant/60 text-sm">
          Chemicals, consumables, and tools — coming online with MODULE 7 from your
          roadmap.
        </p>
      </header>

      <div className="liquid-glass-deep rounded-3xl p-10 text-center">
        <Icon
          name="inventory_2"
          opsz={40}
          className="text-primary/50 mx-auto mb-4"
        />
        <p className="text-on-surface-variant/70 text-sm mb-6">
          Stock movements and automatic deductions per service will appear here.
        </p>
        <Link
          href="/dashboard/orders"
          className={cn(
            buttonVariants({ variant: "liquid", size: "lg" }),
            "rounded-xl gap-2 inline-flex"
          )}
        >
          <Icon name="shopping_cart" opsz={18} />
          Back to orders
        </Link>
      </div>
    </div>
  );
}
