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
  3: "average",
  4: "good",
  5: "excellent",
};

export default function ReviewsCatcher() {
  // Render DOM order 5..1 with flex-row-reverse so we can style
  // "previous" stars using the general sibling selector (~) purely in CSS.
  const stars = [1, 2, 3, 4, 5];

  return (
    <section className="w-full py-10 text-center">
      <div className="mx-auto md:max-w-8xl">
        <h1 className="text-slate-500 font-semibold tracking-tight text-xl md:text-2xl">
          Reviews
        </h1>
        <h2 className="mt-2 md:mt-4 text-slate-700 text-5xl md:text-8xl">
          How did we do?
        </h2>
        <div
          aria-hidden="true"
          className="mx-auto mt-8 h-[3px] w-36 rounded-full bg-gradient-to-r from-[#fb9216] via-[#ffb347] to-[#fb9216] md:mt-8 md:h-1 md:w-96"
        />

        <div className="my-8 md:my-12">
          {/* Stars row */}
          <div className="rc-stars mx-auto flex w-fit items-center justify-center">
            {/* We list 5..1 in DOM and flip visually with flex-row-reverse */}
            <div className="flex flex-row-reverse items-center">
              {stars
                .slice()
                .reverse()
                .map((rating) => {
                  const label = STAR_LABELS[rating];
                  const isExternal = rating >= 4;
                  const aria = `Rate ${rating} out of 5 — ${label}`;

                  const StarSvg = (
                    <Star
                      className="h-12 w-12 md:h-36 md:w-36"
                      // stroke uses currentColor; fill toggled via CSS
                    />
                  );

                  const linkClasses =
                    "inline-flex flex-col items-center justify-center gap-2 text-slate-300 focus:outline-none md:gap-4";

                  const linkContent = (
                    <>
                      {StarSvg}
                      <span className="sr-only">{aria}</span>
                      <span
                        aria-hidden="true"
                        className="rc-star-label text-xs font-semibold uppercase tracking-widest text-slate-500 md:text-base"
                      >
                        {label.toUpperCase()}
                      </span>
                    </>
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
                          className={linkClasses}
                        >
                          {linkContent}
                        </a>
                      ) : (
                        <SmartLink
                          prefetch={false}
                          href={INTERNAL_FEEDBACK_SLUG}
                          aria-label={aria}
                          title={aria}
                          className={linkClasses}
                        >
                          {linkContent}
                        </SmartLink>
                      )}
                    </span>
                  );
                })}
            </div>
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
          gap: 2rem;
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
        .rc-star :global(.rc-star-label) {
          transition: color 160ms ease;
        }
        .rc-stars .flex > span:hover :global(.rc-star-label),
        .rc-stars .flex > span:hover ~ span :global(.rc-star-label),
        .rc-stars .flex > span:focus-within :global(.rc-star-label),
        .rc-stars .flex > span:focus-within ~ span :global(.rc-star-label) {
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
