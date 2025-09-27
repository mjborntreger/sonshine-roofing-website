"use client";

import { ArrowRight } from "lucide-react";
import SmartLink from "@/components/SmartLink";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import MediaFrame from "@/components/MediaFrame";
import type { PostCard } from "@/lib/wp";
import { stripHtml } from "@/lib/wp";
import { lineClampStyle, truncateText } from "@/components/archive/card-utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type Props = {
  post: PostCard;
  style?: React.CSSProperties;
  className?: string;
};

export default function BlogArchiveCard({ post, style, className }: Props) {
  const href = `/${post.slug ?? ""}`;
  const date = post.date ? new Date(post.date) : null;
  const dateLabel = date && !Number.isNaN(date.getTime()) ? dateFormatter.format(date) : "";
  const summarySource = post.contentPlain || stripHtml(post.excerpt || "");
  const summary = truncateText(summarySource, 260);

  return (
    <SmartLink href={href} className={`group block ${className ?? ""}`} style={style} title={post.title}>
      <Card className="overflow-hidden hover:shadow-lg transition">
          <CardHeader className="px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="font-semibold">{post.title}</CardTitle>
          </CardHeader>

          {post.featuredImage?.url ? (
            <MediaFrame
              src={post.featuredImage.url}
              alt={post.featuredImage.altText ?? post.title}
              ratio="16 / 9"
              className="w-full"
              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            />
          ) : (
            <div className="w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />
          )}

          <CardContent className="px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {dateLabel && <span>{dateLabel}</span>}
            </div>

            {summary && (
              <p className="mt-3 text-sm text-slate-600" style={lineClampStyle}>
                {summary}
              </p>
            )}

            {(post.categories?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-slate-100/60 bg-slate-50/40 px-5 py-4 text-[#0045d7] sm:px-6">
            <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
              Read full article
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover/card:translate-x-1 group-focus-visible:translate-x-1 group-focus-visible/card:translate-x-1" />
            </span>
          </CardFooter>
      </Card>
    </SmartLink>
  );
}
