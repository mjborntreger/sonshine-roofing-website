import SmartLink from "@/components/utils/SmartLink";
import type { ProjectTestimonial as ProjectTestimonialData } from "@/lib/content/wp";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ArrowUpRight, Quote } from "lucide-react";

type Props = {
  testimonial?: ProjectTestimonialData | null;
  className?: string;
};

const GOOGLE_LOGO = "https://next.sonshineroofing.com/wp-content/uploads/google.webp";
const OWNER_RESPONSE_IMAGE =
  "https://next.sonshineroofing.com/wp-content/uploads/Nathan-Edited-Bio-Photo-175x175-1.webp";

const formatReviewDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export default function ProjectTestimonial({ testimonial, className }: Props) {
  if (!testimonial?.customerReview) return null;

  const { customerName, customerReview, ownerReply, reviewUrl, reviewDate } = testimonial;
  const formattedDate = formatReviewDate(reviewDate);

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
          <p className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-[--brand-blue] mb-4">
            <Image
              src={GOOGLE_LOGO}
              alt="Google logo"
              width={28}
              height={28}
              className="h-5 w-5 flex-none"
            />
            Homeowner Testimonial
          </p>
          <div className="mt-3 text-sm text-slate-600">
            <p className="text-lg font-semibold text-slate-900">
              {customerName || "SonShine Roofing Homeowner"}
            </p>
            {formattedDate ? <p>{formattedDate}</p> : null}
          </div>
        </div>
        <Quote className="h-10 w-10 text-slate-200" aria-hidden />
      </header>

      <blockquote className="mt-5 space-y-4 text-lg leading-relaxed text-slate-900">
        <p className="whitespace-pre-line">{customerReview}</p>
      </blockquote>

      {reviewUrl ? (
        <SmartLink
          href={reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-icon-affordance="up-right"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[--brand-blue]"
        >
          Read full review on Google
          <ArrowUpRight className="h-4 w-4 inline icon-affordance" />
        </SmartLink>
      ) : null}

      {ownerReply ? (
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
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{ownerReply}</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
