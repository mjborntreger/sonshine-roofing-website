import * as React from "react";
import CardSkeleton, { type CardSkeletonProps } from "@/components/CardSkeleton";
import Grid from "@/components/layout/Grid";

export type SkeletonGridProps = Omit<React.ComponentProps<typeof Grid>, "children"> & {
  /** Number of skeleton cards to render */
  count?: number;
  /** Pass-through options to shape each CardSkeleton */
  withImage?: CardSkeletonProps["withImage"];
  imageAspectClass?: CardSkeletonProps["imageAspectClass"];
  bodyLines?: CardSkeletonProps["bodyLines"];
  showMeta?: CardSkeletonProps["showMeta"];
  /** Optional content kind to auto-pick a stable aspect ratio that matches the real cards */
  variant?: "blog" | "video" | "project";
};

/**
 * SkeletonGrid
 * ------------
 * Drop-in loading state that mirrors your card grid.
 * - Uses the shared <Grid> wrapper so column classes and gaps remain consistent.
 * - Renders N <CardSkeleton/> items, configurable to match different card types.
 */
export default function SkeletonGrid({
  count = 6,
  className,
  withImage = true,
  imageAspectClass,
  bodyLines = 2,
  showMeta = true,
  variant,
  ...gridProps
}: SkeletonGridProps) {
  // Choose a stable aspect class that matches each page's real card media.
  // - blog & video: 16/9
  // - project: 4/3
  const resolvedAspect = React.useMemo(() => {
    if (imageAspectClass) return imageAspectClass;
    switch (variant) {
      case "project":
        return "aspect-[4/3]";
      case "blog":
      case "video":
      default:
        return "aspect-[16/9]";
    }
  }, [imageAspectClass, variant]);

  const items = React.useMemo(() => Array.from({ length: Math.max(0, count | 0) }), [count]);

  return (
    <Grid className={className} {...gridProps}>
      {items.map((_, i) => (
        <CardSkeleton
          key={i}
          withImage={withImage}
          imageAspectClass={resolvedAspect}
          bodyLines={bodyLines}
          showMeta={showMeta}
        />
      ))}
    </Grid>
  );
}