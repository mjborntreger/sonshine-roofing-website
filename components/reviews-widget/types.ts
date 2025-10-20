export type Review = {
  author_name: string;
  author_url?: string | null;
  rating?: number | null;
  text: string;
  time?: number | null;
  relative_time_description?: string | null;
  ownerReply?: string | null;
};

export type ReviewsPayload = {
  avg_rating?: number | string | null;
  reviews?: Review[];
};
