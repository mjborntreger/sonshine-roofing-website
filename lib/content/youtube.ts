import "server-only";

import { cache } from "react";

type UnknownRecord = Record<string, unknown>;

type YouTubeApiThumbnail = {
  url?: string;
  width?: number;
  height?: number;
};

type YouTubeApiSnippet = {
  title?: string;
  description?: string;
  publishedAt?: string;
  thumbnails?: Record<string, YouTubeApiThumbnail | null | undefined>;
  channelTitle?: string;
};

type YouTubeApiItem = {
  id?: string;
  snippet?: YouTubeApiSnippet | null;
};

type YouTubeApiResponse = {
  items?: Array<YouTubeApiItem | null | undefined>;
};

export type YouTubeThumbnail = {
  url: string | null;
  width: number | null;
  height: number | null;
};

export type YouTubeVideoMeta = {
  videoId: string;
  title: string | null;
  description: string | null;
  uploadDate: string | null;
  channelTitle: string | null;
  watchUrl: string;
  thumbnails: Record<string, YouTubeThumbnail>;
};

const YOUTUBE_API_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";
const YOUTUBE_API_REVALIDATE_SECONDS = 60 * 60; // 1 hour

let hasWarnedForMissingKey = false;

const normalizeThumbnail = (thumb: YouTubeApiThumbnail | null | undefined): YouTubeThumbnail => ({
  url: typeof thumb?.url === "string" ? thumb.url : null,
  width: typeof thumb?.width === "number" ? thumb.width : null,
  height: typeof thumb?.height === "number" ? thumb.height : null,
});

const resolveSnippet = (item?: YouTubeApiItem | null): YouTubeApiSnippet | null => {
  if (!item || typeof item !== "object") return null;
  const snippet = item.snippet;
  if (!snippet || typeof snippet !== "object") return null;
  return snippet;
};

const safeString = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  return null;
};

async function fetchYouTubeMeta(videoId: string): Promise<YouTubeVideoMeta | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    if (!hasWarnedForMissingKey && process.env.NODE_ENV !== "production") {
      console.warn(
        "[youtube] Missing YOUTUBE_API_KEY environment variable. Unable to fetch upload dates from YouTube.",
      );
      hasWarnedForMissingKey = true;
    }
    return null;
  }

  const trimmedId = videoId.trim();
  if (!trimmedId) return null;

  const searchParams = new URLSearchParams({
    part: "snippet",
    id: trimmedId,
    maxResults: "1",
    key: apiKey,
  });

  const url = `${YOUTUBE_API_ENDPOINT}?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: YOUTUBE_API_REVALIDATE_SECONDS, tags: [`youtube-video:${trimmedId}`] },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `[youtube] Failed to fetch metadata for ${trimmedId}. Status: ${response.status}. Body: ${text.slice(0, 500)}`,
      );
      return null;
    }

    const data = (await response.json()) as UnknownRecord;
    const responseData = data as YouTubeApiResponse;
    const items = Array.isArray(responseData?.items) ? responseData.items : [];
    const firstItem = items.length > 0 ? items[0] : null;
    const snippet = resolveSnippet(firstItem);

    if (!snippet) return null;

    const rawThumbs = snippet.thumbnails || {};
    const normalizedThumbnails: Record<string, YouTubeThumbnail> = {};
    for (const [key, thumb] of Object.entries(rawThumbs)) {
      normalizedThumbnails[key] = normalizeThumbnail(thumb || undefined);
    }

    return {
      videoId: trimmedId,
      title: safeString(snippet.title),
      description: safeString(snippet.description),
      uploadDate: safeString(snippet.publishedAt),
      channelTitle: safeString(snippet.channelTitle),
      watchUrl: `https://www.youtube.com/watch?v=${trimmedId}`,
      thumbnails: normalizedThumbnails,
    };
  } catch (error) {
    console.error(`[youtube] Error fetching metadata for ${trimmedId}:`, error);
    return null;
  }
}

export const getYouTubeVideoMeta = cache(fetchYouTubeMeta);

export function selectBestThumbnailUrl(
  thumbnails: Record<string, YouTubeThumbnail> | null | undefined,
): string | null {
  if (!thumbnails) return null;
  let bestUrl: string | null = null;
  let bestScore = -1;

  for (const thumb of Object.values(thumbnails)) {
    if (!thumb || typeof thumb !== "object") continue;
    if (!thumb.url) continue;
    const width = typeof thumb.width === "number" ? thumb.width : 0;
    const height = typeof thumb.height === "number" ? thumb.height : 0;
    const score = width * height;
    if (score > bestScore) {
      bestScore = score;
      bestUrl = thumb.url;
    }
  }

  return bestUrl;
}
