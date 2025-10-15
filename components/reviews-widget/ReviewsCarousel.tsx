import ReviewsSliderLazy from '@/components/reviews-widget/ReviewsSliderLazy';
import { Button } from "@/components/ui/button";
import SmartLink from "@/components/utils/SmartLink";
import { ArrowUpRight } from 'lucide-react';

const RAW_REVIEWS_URL = (process.env.NEXT_PUBLIC_REVIEWS_URL ?? '').replace(/\u200B/g, '').trim();
const REVIEWS_URL = RAW_REVIEWS_URL || 'https://next.sonshineroofing.com/wp-content/uploads/sonshine-reviews/reviews-archive.json';

const RAW_GBP_URL = (process.env.NEXT_PUBLIC_GBP_URL ?? '').replace(/\u200B/g, '').trim();
const GBP_URL = RAW_GBP_URL || 'https://www.google.com/maps/place/SonShine+Roofing/data=!4m2!3m1!1s0x0:0x5318594fb175e958';

type Review = {
  author_name: string;
  author_url?: string;
  rating: number;
  text: string;
  time: number; // epoch seconds
  relative_time_description?: string;
};

type ReviewsPayload = {
  avg_rating?: number | string;
  reviews?: Review[];
};

export default async function ReviewsCarousel() {
  try {
    new URL(REVIEWS_URL);
    new URL(GBP_URL);
  } catch (error) {
    console.error('[ReviewsCarousel] Invalid URL:', { REVIEWS_URL, GBP_URL, error });
    return null;
  }

  const res = await fetch(REVIEWS_URL, { next: { revalidate: 21600 } }); // 6h
  if (!res.ok) return null;

  const data: ReviewsPayload = await res.json().catch(err => {
    console.error('[ReviewsCarousel] JSON parse error:', err);
    return {};
  });
  const all: Review[] = Array.isArray(data.reviews) ? data.reviews : [];

  const filtered = all
    .filter(r => r.rating === 5)
    .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))
    .slice(0, 8);

  if (filtered.length === 0) return null;

  return (
    <>
      <div className="py-32 mb-16 max-w-[1600px] mx-auto overflow-hidden">
        <h2 className="text-center text-slate-700 text-3xl md:text-5xl mx-2">What Our Customers Say</h2>
        <p className="text-center mt-3 text-slate-500 hover:text-slate-400 text-sm">
          <SmartLink
            href={GBP_URL}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={`Average Google rating ${Number(data.avg_rating).toFixed(1)} out of 5`}
            data-icon-affordance="up-right"
          >
            View our Business Profile on Google
            <ArrowUpRight className="icon-affordance inline h-3 w-3 ml-2" />
          </SmartLink>
        </p>
        <div className="not-prose text-center mt-6">
          {data?.avg_rating && (
            <SmartLink
              href={GBP_URL}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={`Average Google rating ${Number(data.avg_rating).toFixed(1)} out of 5`}
              className="inline-flex items-center px-4 py-2 btn btn-brand-orange"
              data-icon-affordance="up-right"
            >
              <span className="text-3xl mr-2">{Number(data.avg_rating).toFixed(1)}</span>
              <span aria-hidden="true">★</span>&nbsp;on Google
            </SmartLink>
          )}
          <ReviewsSliderLazy reviews={filtered} gbpUrl={GBP_URL} />
          <div className="text-center">
            <p className="text-sm text-slate-500 italic mb-10">
              All reviews shown above are automatically pulled from Google using the official API.
            </p>
            <Button variant="brandBlue" asChild>
              <SmartLink
                href={GBP_URL}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-icon-affordance="up-right"
              >
                See All Google Reviews
                <ArrowUpRight className="icon-affordance h-4 w-4 inline ml-2" />
              </SmartLink>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
