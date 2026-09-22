import 'server-only';

import { join } from 'node:path';
import { readVideoSnapshot, queryVideoSnapshot, findVideoInSnapshot } from './video-data';
import type { VideoSnapshot, VideoFiltersInput } from './video-types';

export type { VideoFiltersInput } from './video-types';

let snapshot: VideoSnapshot | undefined;
function deployedVideos(): VideoSnapshot {
  // Projects and videos share one atomic artifact packaged with this deployment.
  // A missing or invalid artifact fails closed; runtime never consults a CMS.
  snapshot ??= readVideoSnapshot(join(process.cwd(), '.generated', 'projects.json'));
  return snapshot;
}

export async function listVideoItemsPaged(options: { first?: number; after?: string | null; filters?: VideoFiltersInput } = {}) {
  return queryVideoSnapshot(deployedVideos(), options);
}

export async function listAllVideos() {
  return deployedVideos().videos;
}

export async function listVideoCategories() {
  return deployedVideos().categories;
}

export async function getVideoBySelection(selection: string) {
  return findVideoInSnapshot(deployedVideos(), selection);
}

const PAGE_VIDEO_SELECTIONS = {
  home: 'sonshine-roofing-best-of-the-best-2023',
  about: 'sonshine-roofing-introduction',
} as const;

/** Page placements use the same normalized deployment snapshot as the library. */
export async function getPageVideo(placement: keyof typeof PAGE_VIDEO_SELECTIONS) {
  const video = await getVideoBySelection(PAGE_VIDEO_SELECTIONS[placement]);
  if (!video) throw new Error(`Required published page video is missing: ${placement}`);
  return video;
}
