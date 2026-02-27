import type { CSSProperties } from "react";
import ReviewStarRow from "@/components/reviews-widget/ReviewStarRow";
import { cn } from "@/lib/utils";

type Props = {
  review?: string | null;
  author?: string | null;
  className?: string;
};

const clampStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export default function ProjectReviewSnippet({ review, author, className }: Props) {
  const content = typeof review === "string" ? review.trim() : "";
  if (!content) return null;

  const resolvedAuthor = typeof author === "string" && author.trim().length > 0 ? author.trim() : null;

  return (
    <div className={cn("mt-5 space-y-2", className)}>
      <ReviewStarRow />
      <div className="italic text-slate-500" style={clampStyle}>
        &ldquo;{content}&rdquo;
        {resolvedAuthor ? (
          <span className="not-italic text-slate-600"> — {resolvedAuthor}</span>
        ) : null}
      </div>
    </div>
  );
}
