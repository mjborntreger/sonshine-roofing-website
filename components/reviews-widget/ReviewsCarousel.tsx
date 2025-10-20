import ReviewsSliderLazy from '@/components/reviews-widget/ReviewsSliderLazy';
import { Button } from "@/components/ui/button";
import SmartLink from "@/components/utils/SmartLink";
import { ArrowUpRight } from 'lucide-react';
import type { Review, ReviewsPayload } from './types';
import { renderHighlight } from "@/components/utils/renderHighlight";

const RAW_REVIEWS_URL = (process.env.NEXT_PUBLIC_REVIEWS_URL ?? '').replace(/\u200B/g, '').trim();
const REVIEWS_URL = RAW_REVIEWS_URL || 'https://next.sonshineroofing.com/wp-content/uploads/sonshine-reviews/reviews-archive.json';

const RAW_GBP_URL = (process.env.NEXT_PUBLIC_GBP_URL ?? '').replace(/\u200B/g, '').trim();
const GBP_URL = RAW_GBP_URL || 'https://www.google.com/maps/place/SonShine+Roofing/data=!4m2!3m1!1s0x0:0x5318594fb175e958';

const DEFAULT_CONTAINER_CLASS = "py-32 mb-16 max-w-[1600px] mx-auto overflow-hidden";

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

  if (!sourceReviews.length && fallbackToRemote) {
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
    sourceReviews = Array.isArray(data.reviews) ? data.reviews : [];
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
        <ReviewsSliderLazy reviews={filtered} gbpUrl={resolvedGbpUrl} />
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
