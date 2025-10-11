import { VideoWithSchema } from "@/components/VideoWithSchema";

const ABOUT_CANONICAL = "/about-sonshine-roofing";

export function AboutVideo() {
  return (
    <div className="mt-20">
      <VideoWithSchema
        videoId="Xla6_QBrJ_U"
        title="About SonShine Roofing"
        className="border border-slate-200 shadow-md"
        canonicalUrl={ABOUT_CANONICAL}
        description="Meet the SonShine Roofing team and learn what sets our Sarasota roofing company apart."
        schemaId="about-video"
      />
    </div>
  );
}
