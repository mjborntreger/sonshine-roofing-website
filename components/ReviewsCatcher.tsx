"use client";
import SmartLink from "./SmartLink";
import { Star } from "lucide-react";
import React from "react";

/**
 * ReviewsCatcher
 * - 5 clickable stars (1–3 -> internal feedback; 4–5 -> Google Reviews)
 * - Cumulative hover/focus fill using pure CSS (no JS)
 * - Subtle scale + slight lift for all filled stars
 * - Accessible labels and keyboard support
 * - Uses brand color via CSS var --brand-orange (fallback to #fb9216)
 */

const INTERNAL_FEEDBACK_SLUG = "/tell-us-why?rating=${rating}" as const;
const GOOGLE_REVIEW_URL = "https://g.page/r/CVjpdbFPWRhTEAE/review" as const;

const STAR_LABELS: Record<number, string> = {
  1: "poor",
  2: "fair",
  3: "good",
  4: "very good",
  5: "excellent",
};

export default function ReviewsCatcher() {
  // Render DOM order 5..1 with flex-row-reverse so we can style
  // "previous" stars using the general sibling selector (~) purely in CSS.
  const stars = [1, 2, 3, 4, 5];

  return (
    <section className="w-full py-10 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Reviews
        </h1>
        <h2 className="mt-2 text-xl text-slate-700 md:text-2xl">
          How did we do?
        </h2>

        <div className="mt-8">
          {/* Stars row */}
          <div className="rc-stars mx-auto flex w-fit items-center justify-center gap-2 md:gap-3">
            {/* We list 5..1 in DOM and flip visually with flex-row-reverse */}
            <div className="flex flex-row-reverse items-center gap-2 md:gap-3">
              {stars
                .slice()
                .reverse()
                .map((rating) => {
                  const isExternal = rating >= 4;
                  const aria = `Rate ${rating} out of 5 — ${STAR_LABELS[rating]}`;

                  const StarSvg = (
                    <Star
                      className="h-10 w-10 md:h-12 md:w-12"
                      // stroke uses currentColor; fill toggled via CSS
                    />
                  );

                  return (
                    <span key={rating} className="rc-star inline-flex">
                      {isExternal ? (
                        <a
                          href={GOOGLE_REVIEW_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={aria}
                          title={aria}
                          className="inline-flex items-center justify-center text-slate-300 focus:outline-none"
                        >
                          {StarSvg}
                          <span className="sr-only">{aria}</span>
                        </a>
                      ) : (
                        <SmartLink
                          prefetch={false}
                          href={INTERNAL_FEEDBACK_SLUG}
                          aria-label={aria}
                          title={aria}
                          className="inline-flex items-center justify-center text-slate-300 focus:outline-none"
                        >
                          {StarSvg}
                          <span className="sr-only">{aria}</span>
                        </SmartLink>
                      )}
                    </span>
                  );
                })}
            </div>

            {/* Labels under ends */}
          </div>

          <div className="mx-auto mt-2 grid w-[min(420px,90vw)] grid-cols-2 text-sm text-slate-500 md:mt-3">
            <span className="justify-self-start">poor</span>
            <span className="justify-self-end">excellent</span>
          </div>
        </div>
      </div>

      {/* Component-scoped CSS for cumulative hover & animations */}
      <style jsx>{`
        .rc-stars {
          display: inline-block;
          font-size: 0;
        }
        .rc-stars .flex {
          display: flex;
          gap: 0.25rem;
        }
        .rc-stars .flex > span a {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        /* Always bind fill to currentColor; animate via opacity to avoid flashing */
        .rc-star :global(svg *) {
          fill: currentColor;
          fill-opacity: 0;
          transition: fill-opacity 160ms ease, color 160ms ease;
        }
        .rc-stars .flex > span:hover :global(a),
        .rc-stars .flex > span:hover ~ span :global(a),
        .rc-stars .flex > span:focus-within :global(a),
        .rc-stars .flex > span:focus-within ~ span :global(a) {
          color: var(--brand-orange, #fb9216);
        }
        .rc-stars .flex > span:hover :global(svg *),
        .rc-stars .flex > span:hover ~ span :global(svg *),
        .rc-stars .flex > span:focus-within :global(svg *),
        .rc-stars .flex > span:focus-within ~ span :global(svg *) {
          fill-opacity: 1;
        }
        @media (prefers-reduced-motion: no-preference) {
          .rc-stars .flex > span :global(a) {
            transition: color 160ms ease, transform 160ms cubic-bezier(0.2, 0.7, 0.2, 1);
            will-change: transform;
          }
          .rc-stars .flex > span:hover :global(a),
          .rc-stars .flex > span:hover ~ span :global(a),
          .rc-stars .flex > span:focus-within :global(a),
          .rc-stars .flex > span:focus-within ~ span :global(a) {
            transform: translateY(-1px) scale(1.06);
          }
        }
      `}</style>
    </section>
  );
}