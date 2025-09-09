import * as React from "react";
import { cn } from "@/lib/utils";

type GridProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6", className)}
      {...props}
    >
      {children}
    </div>
  );
});

export default Grid;
