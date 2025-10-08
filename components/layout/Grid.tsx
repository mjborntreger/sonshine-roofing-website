import * as React from "react";
import { cn } from "@/lib/utils";

type GridProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  /** Override the canonical resource layout (grid-cols-1 lg:grid-cols-2 gap-4). */
  useCanonical?: boolean;
};

const canonicalClasses = "grid grid-cols-1 lg:grid-cols-2 gap-4";

const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid(
  { className, children, useCanonical = true, ...props },
  ref
) {
  const base = useCanonical ? canonicalClasses : "grid";
  return (
    <div
      ref={ref}
      className={cn(base, className)}
      {...props}
    >
      {children}
    </div>
  );
});

export default Grid;
