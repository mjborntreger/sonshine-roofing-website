import { SnapshotVideoWithSchema } from '@/components/utils/SnapshotVideoWithSchema';
import { getPageVideo } from '@/lib/content/videos';

export async function AboutVideo() {
  return <div className="my-8">
    <SnapshotVideoWithSchema video={await getPageVideo('about')} canonicalUrl="/about-sonshine-roofing"
      schemaId="about-video" className="border border-slate-200 shadow-md" />
  </div>;
}
