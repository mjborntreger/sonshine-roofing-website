import { VideoWithSchema } from "@/components/utils/VideoWithSchema";
import { getYouTubeVideoMeta, selectBestThumbnailUrl } from "@/lib/content/youtube";

const ABOUT_CANONICAL = "/about-sonshine-roofing";
const ABOUT_VIDEO_ID = "Xla6_QBrJ_U";

export async function AboutVideo() {
  const meta = await getYouTubeVideoMeta(ABOUT_VIDEO_ID).catch(() => null);
  const uploadDate = meta?.uploadDate ?? undefined;
  const contentUrl = meta?.watchUrl ?? undefined;
  const thumbnailUrl = meta ? selectBestThumbnailUrl(meta.thumbnails) ?? undefined : undefined;

  return (
    <div className="my-8">
      <VideoWithSchema
        videoId={ABOUT_VIDEO_ID}
        title="About SonShine Roofing"
        className="border border-slate-200 shadow-md"
        canonicalUrl={ABOUT_CANONICAL}
        description="Meet the SonShine Roofing team and learn what sets our Sarasota roofing company apart."
        schemaId="about-video"
        uploadDate={uploadDate}
        contentUrl={contentUrl}
        thumbnailUrl={thumbnailUrl}
        publisherName={meta?.channelTitle ?? undefined}
      />
    </div>
  );
}
