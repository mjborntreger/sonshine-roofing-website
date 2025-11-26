import * as React from "react";
import { cn } from "@/lib/utils";

type GridProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  /** Override the canonical resource layout (grid-cols-1 md:grid-cols-2 gap-4). */
  useCanonical?: boolean;
  layoutClassName?: string;
};

const canonicalClasses = "grid grid-cols-1 md:grid-cols-2 gap-4";

const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid(
  { className, children, useCanonical = true, layoutClassName, ...props },
  ref
) {
  const base = layoutClassName
  ? cn("grid", layoutClassName)
  : useCanonical
  ? canonicalClasses
  : "grid";

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
