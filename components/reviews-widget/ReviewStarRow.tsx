import { cn } from "@/lib/utils";

type ReviewStarRowProps = {
  rating?: number;
  className?: string;
  srLabel?: string;
};

const STAR_BASE_CLASS = "text-xl leading-none";

export default function ReviewStarRow({ rating = 5, className, srLabel }: ReviewStarRowProps) {
  const cappedRating = Math.min(5, Math.max(0, Math.round(rating)));
  const ariaLabel = srLabel ?? `Rated ${cappedRating} out of 5`;

  return (
    <div className={cn("flex items-center gap-1 text-[#fb9216]", className)}>
      <span className="sr-only">{ariaLabel}</span>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} aria-hidden="true" className={STAR_BASE_CLASS}>
          {index < cappedRating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}
