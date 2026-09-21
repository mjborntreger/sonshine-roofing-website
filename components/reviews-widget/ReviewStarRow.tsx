import { cn } from "@/lib/utils";

type ReviewStarRowProps = {
  rating?: number;
  className?: string;
  srLabel?: string;
  as?: 'div' | 'span';
  variant?: 'text' | 'icon';
  starClassName?: string;
};

const STAR_BASE_CLASS = "text-xl leading-none";

export default function ReviewStarRow({ rating = 5, className, srLabel, as: Tag = 'div', variant = 'text', starClassName }: ReviewStarRowProps) {
  const cappedRating = Math.min(5, Math.max(0, Math.round(rating)));
  const ariaLabel = srLabel ?? `Rated ${cappedRating} out of 5`;

  return (
    <Tag className={cn("flex items-center gap-1 text-[#fb9216]", className)}>
      <span className="sr-only">{ariaLabel}</span>
      {Array.from({ length: 5 }).map((_, index) => variant === 'icon' ? (
        <svg key={index} viewBox="0 0 24 24" aria-hidden="true"
          className={cn('h-6 w-6', starClassName)} fill={index < cappedRating ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={index < cappedRating ? 0 : 1}>
          <path d="M12 .587l3.668 7.431L24 9.753l-6 5.847L19.336 24 12 20.125 4.664 24 6 15.6 0 9.753l8.332-1.735z" />
        </svg>
      ) : (
        <span key={index} aria-hidden="true" className={STAR_BASE_CLASS}>
          {index < cappedRating ? "★" : "☆"}
        </span>
      ))}
    </Tag>
  );
}
