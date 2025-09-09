

import * as React from "react";
import Skeleton from "@/components/Skeleton";

export type CardSkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Show an image block at the top of the card (16:9 by default). */
  withImage?: boolean;
  /** Tailwind aspect class for the image block (e.g., "aspect-[4/3]") */
  imageAspectClass?: string;
  /** How many body lines to render under the title. */
  bodyLines?: number;
  /** Show a footer meta row (e.g., badges/date). */
  showMeta?: boolean;
};

/**
 * CardSkeleton
 * ------------
 * A composable skeleton that mirrors the blog/project/video card layout.
 * - Uses the base <Skeleton/> for shimmer blocks.
 * - Keeps layout minimal so it adapts to your Grid columns out of the box.
 */
const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(function CardSkeleton(
  {
    className,
    withImage = true,
    imageAspectClass = "aspect-[16/9]",
    bodyLines = 2,
    showMeta = true,
    ...props
  },
  ref
) {
  const lines = Math.max(0, bodyLines | 0);

  return (
    <div
      ref={ref}
      className={[
        "overflow-hidden rounded-xl border border-slate-200 bg-white",
        "shadow-[0_0_0_0_rgba(0,0,0,0.02)]", // ultra subtle to match hover transitions
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {withImage && (
        <div className={["relative w-full", imageAspectClass].join(" ")}>
          <Skeleton className="absolute inset-0 h-full w-full" />
        </div>
      )}

      <div className="p-4">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />

        {/* Body lines */}
        <div className="mt-3 space-y-2">
          {Array.from({ length: lines }).map((_, i) => {
            const w =
              i === lines - 1
                ? "w-2/3"
                : i % 3 === 0
                ? "w-full"
                : i % 3 === 1
                ? "w-5/6"
                : "w-4/5";
            return <Skeleton key={i} className={`h-4 ${w}`} />;
          })}
        </div>

        {/* Footer meta (badges/date row) */}
        {showMeta && (
          <div className="mt-4 flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        )}
      </div>
    </div>
  );
});

export default CardSkeleton;