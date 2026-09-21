import Image from 'next/image';
import ReviewStarRow from './ReviewStarRow';
import type { CarouselReview } from './types';

export default function ReviewAttribution({ review, titleId, inButton = false, starVariant, starClassName }: {
  review: CarouselReview; titleId?: string; inButton?: boolean;
  starVariant?: 'text' | 'icon'; starClassName?: string;
}) {
  const Wrapper = inButton ? 'span' : 'header';
  const Heading = inButton ? 'span' : 'h3';
  const Text = inButton ? 'span' : 'p';
  return (
    <Wrapper className="block space-y-2">
      <Heading id={titleId} className="m-0 flex items-start gap-2 text-xl font-bold text-slate-700">
        {review.sourceLogo ? (
          <Image src={review.sourceLogo.src} alt={review.sourceLogo.alt} width={40} height={40} className="h-5 w-5 flex-none" />
        ) : null}
        <span>{review.authorName}</span>
      </Heading>
      <ReviewStarRow rating={review.rating} as={inButton ? 'span' : 'div'} variant={starVariant} starClassName={starClassName} />
      {review.areaName ? <Text className="block text-sm text-slate-600">{review.areaName}</Text> : null}
      {review.dateLabel ? (
        <Text className="block text-xs text-slate-500">
          {review.dateTime ? <time dateTime={review.dateTime}>{review.dateLabel}</time> : review.dateLabel}
        </Text>
      ) : null}
    </Wrapper>
  );
}
