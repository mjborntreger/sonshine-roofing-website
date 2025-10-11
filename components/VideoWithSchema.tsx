import LazyYoutubeEmbed from "./LazyYoutubeEmbed";
import { JsonLd } from "@/lib/seo/json-ld";
import { videoObjectSchema } from "@/lib/seo/schema";
import { resolveSiteOrigin } from "@/lib/seo/site";
import { headers } from "next/headers";

type VideoWithSchemaProps = {
  videoId: string;
  title: string;
  description?: string;
  canonicalUrl?: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  className?: string;
  posterUrl?: string;
  host?: "youtube" | "youtube-nocookie";
  query?: Partial<Record<string, string | number | boolean>>;
  isFamilyFriendly?: boolean;
  publisherName?: string;
  schemaId?: string;
};

export async function VideoWithSchema({
  videoId,
  title,
  description,
  canonicalUrl,
  contentUrl,
  thumbnailUrl,
  uploadDate,
  className,
  posterUrl,
  host = "youtube-nocookie",
  query,
  isFamilyFriendly = true,
  publisherName,
  schemaId,
}: VideoWithSchemaProps) {
  const headerList = headers();
  const origin = resolveSiteOrigin(headerList);

  const embedBase = host === "youtube" ? "https://www.youtube.com/embed/" : "https://www.youtube-nocookie.com/embed/";
  const embedUrl = `${embedBase}${videoId}`;

  const watchUrl =
    typeof contentUrl === "string" && contentUrl.trim().length > 0
      ? contentUrl.trim()
      : `https://www.youtube.com/watch?v=${videoId}`;

  const thumbnail =
    typeof thumbnailUrl === "string" && thumbnailUrl.trim().length > 0
      ? thumbnailUrl.trim()
      : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const schema = videoObjectSchema({
    name: title,
    description,
    canonicalUrl: canonicalUrl && canonicalUrl.trim().length > 0 ? canonicalUrl.trim() : watchUrl,
    contentUrl: watchUrl,
    embedUrl,
    thumbnailUrls: [thumbnail],
    uploadDate,
    origin,
    isFamilyFriendly,
    publisherName,
  });

  return (
    <>
      <JsonLd id={schemaId} data={schema} />
      <LazyYoutubeEmbed
        videoId={videoId}
        title={title}
        className={className}
        posterUrl={posterUrl ?? thumbnail}
        host={host}
        query={query}
      />
    </>
  );
}

