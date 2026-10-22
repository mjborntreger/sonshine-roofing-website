import ReviewStarRow from './ReviewStarRow';
import { GOOGLE_REVIEW_SUMMARY } from '@/lib/reviews-summary';
import { cn } from '@/lib/utils';

type ReviewSummaryProps = {
  tone?: 'default' | 'inverse';
  className?: string;
};

/** Shared business-wide review proof for light and dark heroes. */
export default function ReviewSummary({ tone = 'default', className }: ReviewSummaryProps) {
  const inverse = tone === 'inverse';
  const emphasis = cn('font-semibold', inverse ? 'text-white' : 'text-slate-900');

  return (
    <div
      data-review-summary
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 text-sm',
        inverse ? 'text-slate-200' : 'text-slate-600',
        className,
      )}
    >
      <span aria-hidden="true"><ReviewStarRow rating={GOOGLE_REVIEW_SUMMARY.rating} as="span" /></span>
      <p>
        <strong className={emphasis}>{GOOGLE_REVIEW_SUMMARY.rating}-star average</strong>
        {' from '}
        <strong className={emphasis}>{GOOGLE_REVIEW_SUMMARY.reviewCount} Google reviews</strong>
      </p>
    </div>
  );
}
