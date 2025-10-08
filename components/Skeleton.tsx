import * as React from "react";
import styles from "./Skeleton.module.css";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Set to false to disable the shimmer animation (keeps the base block). */
  shimmer?: boolean;
};

/**
 * Reusable shimmer skeleton block.
 * - Drop-in for any rectangular placeholder.
 * - Uses CSS variables for easy theming:
 *    --skeleton-base (background), --skeleton-highlight (moving band), --skeleton-radius.
 * - Accepts any div props, including className and style.
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, style, shimmer = true, ...props },
  ref
) {
  const classes = [styles.skeleton, shimmer ? styles.shimmer : null, className]
    .filter(Boolean)
    .join(" ");

  return <div ref={ref} aria-hidden="true" className={classes} style={style} {...props} />;
});

export default Skeleton;
