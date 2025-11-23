import ReviewsSliderLazy from "@/components/reviews-widget/ReviewsSliderLazy";
import SmartLink from "@/components/utils/SmartLink";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { Review, ReviewsPayload } from "./types";
import { OWNER_RESPONSE_IMAGE } from "./constants";
import ReviewStarRow from "@/components/reviews-widget/ReviewStarRow";

const RAW_REVIEWS_URL = (process.env.NEXT_PUBLIC_REVIEWS_URL ?? "").replace(/\u200B/g, "").trim();
const REVIEWS_URL =
  RAW_REVIEWS_URL || "https://next.sonshineroofing.com/wp-content/uploads/sonshine-reviews/reviews-archive.json";

const RAW_GBP_URL = (process.env.NEXT_PUBLIC_GBP_URL ?? "").replace(/\u200B/g, "").trim();
const GBP_URL =
  RAW_GBP_URL || "https://www.google.com/maps/place/SonShine+Roofing/data=!4m2!3m1!1s0x0:0x5318594fb175e958";

const DEFAULT_CONTAINER_CLASS = "max-w-[1600px] mx-auto overflow-hidden";

type ReviewsCarouselProps = {
  reviews?: Review[];
  gbpUrl?: string | null;
  className?: string;
  showBusinessProfileLink?: boolean;
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
    gbpUrl: injectedGbpUrl,
    className = DEFAULT_CONTAINER_CLASS,
    showBusinessProfileLink = true,
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

  const shouldAttemptRemote = fallbackToRemote && !sourceReviews.length;

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

    if (!sourceReviews.length) {
      sourceReviews = Array.isArray(data.reviews) ? data.reviews : [];
    }
  }

  const filtered = sourceReviews
    .filter(r => (r.rating ?? 5) === 5)
    .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))
    .slice(0, safeLimit);

  if (filtered.length === 0) return null;

  const googleLinkAriaLabel = 'See All Google Reviews';
  const fallbackId = createFallbackId();

  const fallbackReviews = (
    <div
      id={fallbackId}
      className="grid gap-6 text-left md:grid-cols-2 lg:grid-cols-3"
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
              <div className="flex flex-wrap items-center gap-2">
                <ReviewStarRow rating={ratingValue} />
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
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Image
                    src={OWNER_RESPONSE_IMAGE}
                    alt="Owner response avatar"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full border border-[--brand-cyan] object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="pt-2 text-md font-semibold text-slate-700">Nathan Borntreger</p>
                    <span className="pb-2 text-xs text-slate-500">Owner</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{review.ownerReply}</p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );

  return (
    <div className={className}>
      <div className="text-center not-prose">
        {fallbackReviews}
        <ReviewsSliderLazy reviews={filtered} gbpUrl={resolvedGbpUrl} fallbackId={fallbackId} />
        <div className="mb-4 flex flex-wrap gap-y-4 justify-center mx-auto max-w-6xl">
          {showDisclaimer ? (
            <p className="mx-2 text-sm text-slate-500">
              All reviews shown below are automatically pulled from Google using the official API.
            </p>) : null}
          {showBusinessProfileLink ? (
            <p className="text-md text-slate-700 font-semibold transition hover:text-[--brand-blue]">
              <SmartLink
                href={resolvedGbpUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={googleLinkAriaLabel}
                data-icon-affordance="up-right"
              >
                See All Google Reviews
                <ArrowUpRight className="inline w-3 h-3 ml-2 icon-affordance" />
              </SmartLink>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
