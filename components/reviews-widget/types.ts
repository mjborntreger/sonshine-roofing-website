export type Review = {
  author_name: string;
  author_url?: string | null;
  rating?: number | null;
  text: string;
  time?: number | null;
  relative_time_description?: string | null;
};

/** Public presentation only: callers own selection, ordering, and source attribution. */
export type CarouselReview = {
  id: string;
  authorName: string;
  text: string;
  rating: number;
  dateTime: string | null;
  dateLabel: string | null;
  areaName?: string;
  sourceUrl: string | null;
  sourceLabel: string;
  sourceLogo?: { src: string; alt: string };
};

export type ReviewsSliderProps = {
  reviews: CarouselReview[];
  onReady?: () => void;
  onError?: () => void;
};
