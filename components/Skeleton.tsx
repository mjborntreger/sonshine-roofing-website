"use client";

import * as React from "react";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
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
  const classes = ["ss-skeleton", shimmer ? "ss-shimmer" : null, className]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        ref={ref}
        aria-hidden="true"
        className={classes}
        style={style}
        {...props}
      />
      <style jsx>{`
        .ss-skeleton {
          position: relative;
          overflow: hidden;
          display: block;
          width: 100%;
          height: 1rem;
          border-radius: var(--skeleton-radius, 0.5rem);
          background: var(--skeleton-base, rgba(0, 0, 0, 0.06));
        }
        @media (prefers-color-scheme: dark) {
          .ss-skeleton {
            background: var(--skeleton-base, rgba(255, 255, 255, 0.08));
          }
        }
        .ss-skeleton.ss-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            transparent,
            var(--skeleton-highlight, rgba(255, 255, 255, 0.35)),
            transparent
          );
          animation: ss-shimmer 1.25s ease-in-out infinite;
        }
        @keyframes ss-shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
});

export default Skeleton;