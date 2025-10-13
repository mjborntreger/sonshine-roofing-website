import { JsonLd } from "@/lib/seo/json-ld";
import { videoObjectSchema } from "@/lib/seo/schema";
import { SITE_ORIGIN } from "@/lib/seo/site";
import { getYouTubeVideoMeta, selectBestThumbnailUrl } from "@/lib/youtube";
import LazyYoutubeEmbed from "./LazyYoutubeEmbed";

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
  origin?: string;
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
  origin: originOverride,
}: VideoWithSchemaProps) {
  const origin = originOverride ?? SITE_ORIGIN;

  const embedBase = host === "youtube" ? "https://www.youtube.com/embed/" : "https://www.youtube-nocookie.com/embed/";
  const embedUrl = `${embedBase}${videoId}`;

  const providedContentUrl = typeof contentUrl === "string" ? contentUrl.trim() : "";
  const defaultWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let resolvedContentUrl = providedContentUrl.length > 0 ? providedContentUrl : defaultWatchUrl;

  const providedThumbnail = typeof thumbnailUrl === "string" ? thumbnailUrl.trim() : "";
  let resolvedThumbnail =
    providedThumbnail.length > 0 ? providedThumbnail : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  let resolvedDescription = description;
  let resolvedUploadDate = uploadDate;

  const shouldFetchMeta =
    !resolvedUploadDate ||
    !resolvedDescription ||
    (providedContentUrl.length === 0 && resolvedContentUrl === defaultWatchUrl) ||
    providedThumbnail.length === 0;

  if (shouldFetchMeta) {
    const meta = await getYouTubeVideoMeta(videoId).catch(() => null);
    if (meta) {
      if (!resolvedUploadDate && meta.uploadDate) resolvedUploadDate = meta.uploadDate;

      if (resolvedContentUrl === defaultWatchUrl && meta.watchUrl) {
        resolvedContentUrl = meta.watchUrl;
      }

      if (providedThumbnail.length === 0) {
        const bestThumbnail = selectBestThumbnailUrl(meta.thumbnails);
        if (bestThumbnail) resolvedThumbnail = bestThumbnail;
      }

      if (!resolvedDescription && meta.description) {
        resolvedDescription = meta.description;
      }
    }
  }

  const resolvedCanonical =
    canonicalUrl && canonicalUrl.trim().length > 0 ? canonicalUrl.trim() : resolvedContentUrl;

  const finalDescription = resolvedDescription?.trim();

  const schema = videoObjectSchema({
    name: title,
    description: finalDescription,
    canonicalUrl: resolvedCanonical,
    contentUrl: resolvedContentUrl,
    embedUrl,
    thumbnailUrls: [resolvedThumbnail],
    uploadDate: resolvedUploadDate,
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
        posterUrl={posterUrl ?? resolvedThumbnail}
        host={host}
        query={query}
      />
    </>
  );
}
