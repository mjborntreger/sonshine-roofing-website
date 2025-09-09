import * as React from "react";
import { cn } from "@/lib/utils";

// ---- Helpers for proper children handling ----
type DivProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode };
type H3Props = React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode };
type PProps  = React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode };

export function Card({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "not-prose rounded-2xl overflow-hidden",
        "border border-slate-400 bg-white text-slate-900 shadow-md",
        "transform-gpu transition-transform duration-300 hover:shadow-md hover:border-[#0045d7] hover:shadow-[#0045d7]/20 motion-safe:hover:scale-[1.02] motion-reduce:transform-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: DivProps) {
  return (
    <div className={cn("relative flex flex-col space-y-1.5 p-6", className)} {...props}>
      {children}
      {/* SonShine gradient stripe under header */}
      <span className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
    </div>
  );
}

export function CardTitle({ className, children, ...props }: H3Props) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: PProps) {
  return (
    <p className={cn("text-sm text-slate-600", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: DivProps) {
  return (
    <div className={cn("p-6 pt-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: DivProps) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}
