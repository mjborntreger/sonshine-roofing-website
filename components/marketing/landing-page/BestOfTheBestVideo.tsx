import { VideoWithSchema } from "@/components/utils/VideoWithSchema";
import { getYouTubeVideoMeta, selectBestThumbnailUrl } from "@/lib/content/youtube";

const BEST_OF_VIDEO_ID = "BGJSGve7Rpk";

export async function BestOfTheBestVideo() {
  const meta = await getYouTubeVideoMeta(BEST_OF_VIDEO_ID).catch(() => null);
  const uploadDate = meta?.uploadDate ?? undefined;
  const contentUrl = meta?.watchUrl ?? undefined;
  const thumbnailUrl = meta ? selectBestThumbnailUrl(meta.thumbnails) ?? undefined : undefined;

  return (
    <VideoWithSchema
      videoId={BEST_OF_VIDEO_ID}
      title="SonShine Roofing - Best of the Best 2023"
      className="border border-slate-300 shadow-lg"
      canonicalUrl="/"
      description="Best of the Best TV highlights why SonShine Roofing stands out among roofing contractors."
      schemaId="best-of-the-best-video"
      uploadDate={uploadDate}
      contentUrl={contentUrl}
      thumbnailUrl={thumbnailUrl}
      publisherName={meta?.channelTitle ?? undefined}
    />
  );
}
