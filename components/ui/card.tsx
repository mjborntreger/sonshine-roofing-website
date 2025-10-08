import * as React from "react";
import { cn } from "@/lib/utils";

// ---- Helpers for proper children handling ----
type DivProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode };
type H3Props = React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode };

export const Card = React.forwardRef<HTMLDivElement, DivProps>(function Card(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "group/card not-prose rounded-3xl overflow-hidden",
        "border border-slate-200 bg-white text-slate-900 shadow-sm md:shadow-md",
        "transform-gpu transition-all duration-300",
        "hover:border-[#1C6FFF] hover:shadow-lg motion-safe:hover:-translate-y-[2px] motion-reduce:transform-none",
        "focus-visible:border-[#1C6FFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C6FFF]",
        "group-focus-visible:border-[#1C6FFF] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[#1C6FFF] group-focus-visible:shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardHeader = React.forwardRef<HTMLDivElement, DivProps>(function CardHeader(
  { className, children, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn("relative flex flex-col space-y-1.5 p-6", className)} {...props}>
      {children}
      {/* SonShine gradient stripe under header */}
      <span className="pointer-events-none absolute bottom-0 left-0 h-1 w-full overflow-hidden">
        <span
          className="block h-full w-full bg-gradient-to-r from-[#0045d7] via-[#1c6fff] to-[#00e3fe] [background-size:200%_100%] [background-position:0%_50%] motion-safe:group-hover:animate-[stripe-slide_600ms_ease-out_forwards] motion-safe:group-hover/card:animate-[stripe-slide_600ms_ease-out_forwards] motion-safe:group-focus-visible:animate-[stripe-slide_600ms_ease-out_forwards] motion-safe:group-focus-visible/card:animate-[stripe-slide_600ms_ease-out_forwards]"
        />
      </span>
    </div>
  );
});

export const CardTitle = React.forwardRef<HTMLHeadingElement, H3Props>(function CardTitle(
  { className, children, ...props },
  ref
) {
  return (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-slate-900", className)}
      {...props}
    >
      {children}
    </h3>
  );
});

export const CardContent = React.forwardRef<HTMLDivElement, DivProps>(function CardContent(
  { className, children, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn("p-6 pt-4", className)} {...props}>
      {children}
    </div>
  );
});

export const CardFooter = React.forwardRef<HTMLDivElement, DivProps>(function CardFooter(
  { className, children, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
});
