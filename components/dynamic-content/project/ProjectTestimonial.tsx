import SmartLink from "@/components/utils/SmartLink";
import type { ProjectTestimonial as ProjectTestimonialData } from "@/lib/content/wp";
import { DEFAULT_REVIEW_PLATFORM, getReviewPlatformMeta, type ReviewPlatform } from "@/lib/reviews/platforms";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ArrowUpRight, Quote, Star } from "lucide-react";

type Props = {
  testimonial?: ProjectTestimonialData | null;
  className?: string;
  customerName?: string;
  formattedDate?: string;
  customerReview?: string;
  reviewUrl?: string;
  ownerReply?: string;
  reviewPlatform?: ReviewPlatform;
};

const OWNER_RESPONSE_IMAGE =
  "https://next.sonshineroofing.com/wp-content/uploads/Nathan-Edited-Bio-Photo-175x175-1.webp";

const formatReviewDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export default function ProjectTestimonial({
  testimonial,
  className,
  customerName,
  formattedDate,
  customerReview,
  reviewUrl,
  ownerReply,
  reviewPlatform,
}: Props) {
  const resolvedReview = customerReview ?? testimonial?.customerReview;
  if (!resolvedReview) return null;

  const resolvedName = customerName ?? testimonial?.customerName ?? "SonShine Roofing Homeowner";
  const resolvedDate = formattedDate ?? formatReviewDate(testimonial?.reviewDate);
  const resolvedUrl = reviewUrl ?? testimonial?.reviewUrl;
  const resolvedOwnerReply = ownerReply ?? testimonial?.ownerReply;
  const resolvedPlatform = reviewPlatform ?? testimonial?.reviewPlatform ?? DEFAULT_REVIEW_PLATFORM;
  const platformMeta = getReviewPlatformMeta(resolvedPlatform);

  return (
    <section
      className={cn(
        "rounded-3xl border border-slate-200 bg-white p-6 shadow-md",
        "transition hover:shadow-lg",
        className
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <p
            className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] mb-4"
            style={{ color: platformMeta.accentColor }}
          >
            <Image
              src={platformMeta.logoSrc}
              alt={platformMeta.logoAlt}
              width={28}
              height={28}
              className="h-5 w-5 flex-none"
            />
            Homeowner Testimonial
          </p>
          <div className="mt-3 text-sm text-slate-600">
            <p className="text-lg font-semibold text-slate-900">{resolvedName}</p>
            {resolvedDate ? <p>{resolvedDate}</p> : null}
          </div>
        </div>
        <Quote
          className="h-10 w-10 opacity-20"
          style={{ color: platformMeta.accentColor }}
          aria-hidden
        />
      </header>

      <div className="mt-2 flex items-center gap-1 text-amber-400" role="img" aria-label="Rated five out of five stars">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={`review-star-${index}`}
            className="h-4 w-4"
            fill="currentColor"
            stroke="none"
            aria-hidden="true"
          />
        ))}
      </div>

      <blockquote className="mt-5 space-y-4 text-lg leading-relaxed text-slate-900">
        <p className="whitespace-pre-line">{resolvedReview}</p>
      </blockquote>

      {resolvedUrl ? (
        <SmartLink
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-icon-affordance="up-right"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: platformMeta.accentColor }}
        >
          Read original review on {platformMeta.label}
          <ArrowUpRight className="h-4 w-4 inline icon-affordance" />
        </SmartLink>
      ) : null}

      {resolvedOwnerReply ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <Image
              src={OWNER_RESPONSE_IMAGE}
              alt="Owner response avatar"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full border border-blue-100 object-cover"
              loading="lazy"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nathan Borntreger</p>
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{resolvedOwnerReply}</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
