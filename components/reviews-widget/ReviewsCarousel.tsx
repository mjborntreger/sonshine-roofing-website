import ReviewsSliderLazy from "@/components/reviews-widget/ReviewsSliderLazy";
import { Button } from "@/components/ui/button";
import SmartLink from "@/components/utils/SmartLink";
import { ArrowUpRight } from "lucide-react";
import type { Review, ReviewsPayload } from "./types";
import { renderHighlight } from "@/components/utils/renderHighlight";

const RAW_REVIEWS_URL = (process.env.NEXT_PUBLIC_REVIEWS_URL ?? "").replace(/\u200B/g, "").trim();
const REVIEWS_URL =
  RAW_REVIEWS_URL || "https://next.sonshineroofing.com/wp-content/uploads/sonshine-reviews/reviews-archive.json";

const RAW_GBP_URL = (process.env.NEXT_PUBLIC_GBP_URL ?? "").replace(/\u200B/g, "").trim();
const GBP_URL =
  RAW_GBP_URL || "https://www.google.com/maps/place/SonShine+Roofing/data=!4m2!3m1!1s0x0:0x5318594fb175e958";

const DEFAULT_CONTAINER_CLASS = "py-32 max-w-[1600px] mx-auto overflow-hidden";

type ReviewsCarouselProps = {
  reviews?: Review[];
  avgRating?: number | string | null;
  gbpUrl?: string | null;
  heading?: string | null;
  highlightText?: string | null;
  className?: string;
  showBusinessProfileLink?: boolean;
  showRatingSummary?: boolean;
  showSeeAllButton?: boolean;
  showDisclaimer?: boolean;
  limit?: number;
  fallbackToRemote?: boolean;
};

const ensureValidUrl = (value?: string | null): string | null => {
  if (!value) return null;
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
};

const toNumberOrNull = (value: number | string | null | undefined): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const sanitizeLimit = (value?: number): number =>
  Number.isFinite(value) && value !== undefined && value > 0 ? Math.floor(value) : 8;

const ordinalize = (day: number): string => {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
};

const formatReviewDate = (time?: number | null, fallback?: string | null): string | null => {
  if (typeof time === 'number' && Number.isFinite(time) && time > 0) {
    const date = new Date(time * 1000);
    if (!Number.isNaN(date.getTime())) {
      const month = date.toLocaleString('en-US', { month: 'long' });
      const day = ordinalize(date.getDate());
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    }
  }
  return fallback?.trim() || null;
};

const createFallbackId = (): string => `reviews-fallback-${Math.random().toString(36).slice(2, 10)}`;

export default async function ReviewsCarousel(props?: ReviewsCarouselProps) {
  const {
    reviews: injectedReviews,
    avgRating: injectedAvgRating,
    gbpUrl: injectedGbpUrl,
    heading = "What Our Customers Say",
    highlightText,
    className = DEFAULT_CONTAINER_CLASS,
    showBusinessProfileLink = true,
    showRatingSummary = true,
    showSeeAllButton = true,
    showDisclaimer = true,
    limit,
    fallbackToRemote = true,
  } = props ?? {};

  const safeLimit = sanitizeLimit(limit);
  const resolvedGbpUrl = ensureValidUrl(injectedGbpUrl ?? GBP_URL);
  if (!resolvedGbpUrl) {
    console.error('[ReviewsCarousel] Invalid GBP URL:', { injectedGbpUrl, GBP_URL });
    return null;
  }

  let sourceReviews: Review[] = Array.isArray(injectedReviews) ? injectedReviews : [];
  let avgRatingValue = toNumberOrNull(injectedAvgRating);

  const shouldAttemptRemote =
    fallbackToRemote && (!sourceReviews.length || avgRatingValue === null);

  if (shouldAttemptRemote) {
    const resolvedReviewsUrl = ensureValidUrl(REVIEWS_URL);
    if (!resolvedReviewsUrl) {
      console.error('[ReviewsCarousel] Invalid reviews feed URL:', { REVIEWS_URL });
      return null;
    }

    const res = await fetch(resolvedReviewsUrl, { next: { revalidate: 21600 } }); // 6h
    if (!res.ok) return null;

    const data: ReviewsPayload = await res.json().catch(err => {
      console.error('[ReviewsCarousel] JSON parse error:', err);
      return {};
    });

    avgRatingValue = avgRatingValue ?? toNumberOrNull(data.avg_rating);

    if (!sourceReviews.length) {
      sourceReviews = Array.isArray(data.reviews) ? data.reviews : [];
    }
  }

  const filtered = sourceReviews
    .filter(r => (r.rating ?? 5) === 5)
    .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))
    .slice(0, safeLimit);

  if (filtered.length === 0) return null;

  const avgRatingDisplay = typeof avgRatingValue === 'number' ? avgRatingValue.toFixed(1) : null;
  const hasRatingSummary = showRatingSummary && !!avgRatingDisplay;
  const googleLinkAriaLabel = hasRatingSummary
    ? `Average Google rating ${avgRatingDisplay} out of 5`
    : 'View our Business Profile on Google';
  const renderedHeading = heading ? renderHighlight(heading, highlightText) : null;
  const fallbackId = createFallbackId();

  const fallbackReviews = (
    <div
      id={fallbackId}
      className="grid gap-6 mt-10 text-left md:grid-cols-2 lg:grid-cols-3"
    >
      {filtered.map((review, index) => {
        const ratingValue = Math.min(5, Math.max(0, Math.round(review.rating ?? 5)));
        const formattedDate = formatReviewDate(review.time, review.relative_time_description);
        return (
          <article
            key={`${review.author_name}-${review.time ?? index}`}
            className="flex flex-col h-full p-6 text-left rounded-3xl border border-slate-200 bg-white/80 shadow-sm"
          >
            <header className="flex flex-col gap-2">
              <div className="text-lg font-semibold text-slate-800">{review.author_name}</div>
              <div className="flex flex-wrap items-center gap-2 text-[#fb9216]">
                <span className="sr-only">{`Rated ${ratingValue} out of 5`}</span>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <span key={starIndex} aria-hidden="true" className="text-xl leading-none">
                    {starIndex < ratingValue ? '★' : '☆'}
                  </span>
                ))}
                {formattedDate ? (
                  <span className="text-xs font-medium tracking-wide uppercase text-slate-400">
                    {formattedDate}
                  </span>
                ) : null}
              </div>
            </header>
            <p className="mt-4 text-sm leading-7 whitespace-pre-line text-slate-700 flex-1">
              {review.text}
            </p>
            {review.ownerReply ? (
              <blockquote className="pl-4 mt-4 text-sm italic text-left border-l-4 border-blue-500 text-slate-600">
                {review.ownerReply}
              </blockquote>
            ) : null}
          </article>
        );
      })}
    </div>
  );

  return (
    <div className={className}>
      {heading ? (
        <h2 className="mx-2 text-3xl text-center text-slate-700 md:text-5xl">
          {renderedHeading}
        </h2>
      ) : null}
      {showBusinessProfileLink ? (
        <p className="mt-3 text-sm text-center text-slate-500 hover:text-slate-400">
          <SmartLink
            href={resolvedGbpUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={googleLinkAriaLabel}
            data-icon-affordance="up-right"
          >
            Our Business Profile on Google
            <ArrowUpRight className="inline w-3 h-3 ml-2 icon-affordance" />
          </SmartLink>
        </p>
      ) : null}
      <div className="mt-6 text-center not-prose">
        {hasRatingSummary && (
          <SmartLink
            href={resolvedGbpUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={`Average Google rating ${avgRatingDisplay} out of 5`}
            className="inline-flex items-center px-4 py-2 btn btn-brand-orange"
            data-icon-affordance="up-right"
          >
            <span className="mr-2 text-3xl">{avgRatingDisplay}</span>
            <span aria-hidden="true">★</span>&nbsp;on Google
          </SmartLink>
        )}
        {fallbackReviews}
        <ReviewsSliderLazy reviews={filtered} gbpUrl={resolvedGbpUrl} fallbackId={fallbackId} />
        <div className="text-center">
          {showDisclaimer ? (
            <p className="mb-10 text-sm italic text-slate-500">
              All reviews shown above are automatically pulled from Google using the official API.
            </p>
          ) : null}
          {showSeeAllButton ? (
            <Button variant="brandBlue" asChild>
              <SmartLink
                href={resolvedGbpUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-icon-affordance="up-right"
              >
                See All Google Reviews
                <ArrowUpRight className="inline w-4 h-4 ml-2 icon-affordance" />
              </SmartLink>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
