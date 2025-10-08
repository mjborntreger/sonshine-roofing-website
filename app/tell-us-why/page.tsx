import { Suspense } from 'react';
import TellUsWhyForm from './TellUsWhyForm';

const RATING_VALUES = ['1', '2', '3'] as const;
type RatingString = (typeof RATING_VALUES)[number];

const ratingValueLookup: Record<RatingString, 1 | 2 | 3> = {
  '1': 1,
  '2': 2,
  '3': 3,
};

type TellUsWhySearchParams = Record<string, string | string[] | undefined>;

type TellUsWhyPageProps = {
  searchParams?: Promise<TellUsWhySearchParams>;
};

function toRatingString(input: string | string[] | undefined): RatingString {
  if (Array.isArray(input)) {
    return toRatingString(input[0]);
  }
  if (typeof input === 'string' && RATING_VALUES.includes(input as RatingString)) {
    return input as RatingString;
  }
  return '3';
}

export default async function TellUsWhyPage({ searchParams }: TellUsWhyPageProps) {
  const params = searchParams ? await searchParams : ({} as TellUsWhySearchParams);
  const ratingParam = params.rating;
  const rating = toRatingString(ratingParam);
  const ratingValue = ratingValueLookup[rating];

  return (
    <Suspense
      fallback={
        <main className="container-edge mx-auto max-w-2xl py-10">
          <h1 className="text-3xl font-semibold">Tell us what went wrong</h1>
          <p className="mt-2 text-slate-700">Loading…</p>
        </main>
      }
    >
      <TellUsWhyForm rating={rating} ratingValue={ratingValue} />
    </Suspense>
  );
}
