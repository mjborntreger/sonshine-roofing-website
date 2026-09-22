import { SnapshotVideoWithSchema } from '@/components/utils/SnapshotVideoWithSchema';
import { getPageVideo } from '@/lib/content/videos';

export async function BestOfTheBestVideo() {
  return <SnapshotVideoWithSchema video={await getPageVideo('home')} canonicalUrl="/"
    schemaId="best-of-the-best-video" className="border border-slate-300 shadow-lg" />;
}
