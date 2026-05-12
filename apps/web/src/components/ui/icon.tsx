import * as React from "react";

import { cn } from "@/lib/utils";

type IconProps = React.ComponentProps<"span"> & {
  /** Material Symbols glyph name, e.g. "dashboard", "directions_car" */
  name: string;
  /** Filled vs outlined */
  filled?: boolean;
  /** Optical size 20–48; default 24 */
  opsz?: number;
  /** Weight 100–700; default 400 */
  weight?: number;
};

/**
 * Material Symbols Outlined wrapper.
 * The font itself is loaded once in `app/layout.tsx`.
 */
export function Icon({
  name,
  filled = false,
  opsz = 24,
  weight = 400,
  className,
  style,
  ...rest
}: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined", className)}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${opsz}`,
        ...style,
      }}
      {...rest}
    >
      {name}
    </span>
  );
}
