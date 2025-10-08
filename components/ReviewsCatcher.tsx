import SmartLink from "./SmartLink";
import { Star } from "lucide-react";
import React from "react";
import { buildTellUsWhyRatingHref } from "@/lib/routes";
import styles from "./ReviewsCatcher.module.css";

/**
 * ReviewsCatcher
 * - 5 clickable stars (1–3 -> internal feedback; 4–5 -> Google Reviews)
 * - Cumulative hover/focus fill using pure CSS (no JS)
 * - Subtle scale + slight lift for all filled stars
 * - Accessible labels and keyboard support
 * - Uses brand color via CSS var --brand-orange (fallback to #fb9216)
 */

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
          <div className={`${styles.rcStars} mx-auto w-fit`}>
            {/* We list 5..1 in DOM and flip visually with flex-row-reverse */}
            <div className={`${styles.starRow} flex flex-row-reverse items-center`}>
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

                  const linkClasses = `${styles.starLink} inline-flex flex-col items-center justify-center gap-2 text-slate-300 focus:outline-none md:gap-4`;

                  const linkContent = (
                    <>
                      {StarSvg}
                      <span className="sr-only">{aria}</span>
                      <span
                        aria-hidden="true"
                        className={`${styles.starLabel} text-xs font-semibold uppercase tracking-widest text-slate-500 md:text-base`}
                      >
                        {label.toUpperCase()}
                      </span>
                    </>
                  );

                  return (
                    <span key={rating} className={styles.starWrapper}>
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
                          href={buildTellUsWhyRatingHref(rating)}
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
    </section>
  );
}
