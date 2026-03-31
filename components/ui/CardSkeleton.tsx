import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BLOG_PREVIEW_CARD_MIN_HEIGHT_CLASS,
  PROJECT_PREVIEW_CARD_MIN_HEIGHT_CLASS,
} from "@/components/dynamic-content/card-utils";
import { cn } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

export type CardSkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Which card layout to mirror. Defaults to the blog card. */
  variant?: "blog" | "project" | "video";
  /** Show an image block that matches the card media slot. */
  withImage?: boolean;
  /** Tailwind aspect class for the image block (e.g., "aspect-[4/3]"). */
  imageAspectClass?: string;
  /** How many body lines to render under the title. */
  bodyLines?: number;
  /** Show the meta row (e.g., blog date) when the layout includes one. */
  showMeta?: boolean;
};

const DEFAULT_CHIP_COUNT = 3;

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(function CardSkeleton(
  {
    className,
    variant = "blog",
    withImage = true,
    imageAspectClass,
    bodyLines = 2,
    showMeta = true,
    ...props
  },
  ref
) {
  const lines = Math.max(0, bodyLines | 0);
  const resolvedAspect =
    imageAspectClass ?? (variant === "project" ? "aspect-[16/10]" : "aspect-[16/9]");

  const cardClassName = cn(
    variant === "video"
      ? "vid-card overflow-hidden transition hover:shadow-lg"
      : "flex h-full flex-col overflow-hidden transition hover:shadow-lg",
    variant === "blog" && BLOG_PREVIEW_CARD_MIN_HEIGHT_CLASS,
    variant === "project" && PROJECT_PREVIEW_CARD_MIN_HEIGHT_CLASS,
    className
  );
  const headerClassName = variant === "video" ? undefined : "px-5 pb-5 pt-5 sm:px-6 sm:pt-6";
  const contentClassName = "flex flex-1 flex-col px-5 pb-4 pt-5 sm:px-6 sm:pb-6";
  const footerClassName =
    "mt-auto flex items-center justify-between border-t border-slate-100/60 bg-slate-50/40 px-5 py-4 text-[#0045d7] sm:px-6";

  const renderBodyLines = (wrapperClassName?: string) => {
    if (lines === 0) return null;
    return (
      <div className={cn("space-y-2", wrapperClassName)}>
        {Array.from({ length: lines }).map((_, i) => {
          const widthClass =
            i === lines - 1
              ? "w-2/3"
              : i % 3 === 0
              ? "w-full"
              : i % 3 === 1
              ? "w-5/6"
              : "w-4/5";
          return <Skeleton key={`line-${i}`} className={cn("h-4", widthClass)} />;
        })}
      </div>
    );
  };

  const renderChipRow = (
    count: number,
    size: "small" | "large",
    containerClassName?: string
  ) => {
    const height = size === "small" ? "h-6" : "h-7";
    const width = size === "small" ? "w-16" : "w-24";
    return (
      <div className={cn("flex gap-2", containerClassName)}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={`chip-${size}-${i}`} className={cn(height, width, "rounded-full")} />
        ))}
      </div>
    );
  };

  const renderPreviewPillStrip = (size: "small" | "large", slotClassName?: string) => (
    <div className={cn("relative -mx-5 sm:-mx-6", slotClassName)}>
      <div className="flex flex-nowrap gap-2 overflow-x-auto px-5 pb-2 scrollbar-none sm:px-6">
        {renderChipRow(DEFAULT_CHIP_COUNT, size)}
      </div>
      <div className="pointer-events-none absolute inset-y-1 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-1 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
    </div>
  );

  const renderProjectPills = () => (
    renderPreviewPillStrip("large", "mt-4 min-h-[2.875rem]")
  );

  return (
    <Card ref={ref} className={cardClassName} {...props}>
      <CardHeader className={headerClassName}>
        <CardTitle
          className={cn(
            variant === "video" ? "font-medium" : "font-semibold",
            variant === "blog" && "min-h-[3rem]",
            variant === "project" && "min-h-[3.75rem]",
          )}
        >
          <Skeleton className="h-6 w-3/4" />
        </CardTitle>
      </CardHeader>

      {withImage && (
        <div className={cn("relative w-full", resolvedAspect)}>
          <Skeleton className="absolute inset-0 h-full w-full" />
          {variant === "video" && (
            <span className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="grid place-items-center rounded-full bg-white/90 p-4 shadow-md">
                <span className="h-4 w-4 rounded-full bg-slate-300" />
              </span>
            </span>
          )}
        </div>
      )}

      <CardContent className={contentClassName}>
        {variant === "blog" && (
          <>
            {showMeta && (
              <div className="flex min-h-5 items-center text-sm text-slate-600">
                <Skeleton className="h-4 w-24" />
              </div>
            )}

            <div className="mt-3 min-h-[4.5rem]">
              {renderBodyLines(showMeta ? undefined : "mt-2")}
            </div>
            {renderPreviewPillStrip("small", "mt-3 min-h-[2.75rem]")}
          </>
        )}

        {variant === "project" && (
          <>
            <div className="min-h-[5.25rem]">
              {renderBodyLines()}
            </div>
            <div className="mt-5 min-h-[8rem] space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            {renderProjectPills()}
          </>
        )}

        {variant === "video" && (
          <>
            {renderBodyLines()}
            {renderChipRow(DEFAULT_CHIP_COUNT, "small", "mt-3")}
            <div className="mt-3">
              <Skeleton className="h-4 w-40" />
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className={footerClassName}>
        <div className="inline-flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </CardFooter>
    </Card>
  );
});

export default CardSkeleton;
