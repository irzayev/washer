import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        clean: "badge-clean text-on-surface-variant",
        primary: "bg-primary/10 text-primary border border-primary/20",
        outline: "border border-white/10 bg-white/5 text-outline",
        success: "bg-emerald-400/5 text-emerald-300 border border-emerald-400/20",
        warning: "bg-orange-400/5 text-orange-300 border border-orange-400/20",
        danger: "bg-destructive/10 text-destructive border border-destructive/30",
        platinum: "badge-clean text-primary",
        gold: "badge-clean text-amber-300",
        silver: "badge-clean text-outline",
      },
    },
    defaultVariants: {
      variant: "clean",
    },
  }
);

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
