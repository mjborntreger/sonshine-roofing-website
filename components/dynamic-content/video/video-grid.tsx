// app/video-library/video-grid.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import InfiniteList from "@/components/dynamic-content/InfiniteList";
import type { VideoItem } from "@/lib/content/wp";
import type { PageResult } from "@/lib/ui/pagination";

const VideoModal = dynamic<{ video: VideoItem | null; isOpen: boolean; onClose: () => void }>(
  () => import("./VideoModal"),
  { ssr: false }
);

/**
 * VideoGrid component displays a grid of videos.
 * @param initial - initial page result of video items
 * @param items - optional array of video items
 * @param filters - server-provided filters (bucket/material/service)
 * @param pageSize - number of items per page
 */
export default function VideoGrid({
  initial,
  items,
  filters = {},
  pageSize = 6,
  listKey,
}: {
  initial?: PageResult<VideoItem>;
  items?: VideoItem[];
  filters?: Record<string, unknown>;
  pageSize?: number;
  listKey?: string;
}) {
  const [active, setActive] = useState<VideoItem | null>(null);
  const [modalVideo, setModalVideo] = useState<VideoItem | null>(null);
  const [modalMounted, setModalMounted] = useState(false);
  const lastListKeyRef = useRef<string | undefined>(listKey);

  const announceOpen = useCallback((slug?: string | null) => {
    try {
      window.dispatchEvent(new CustomEvent('video:open', { detail: { slug } }));
    } catch {
      // swallow errors triggered by restricted dispatch environments
    }
  }, []);
  const announceClose = useCallback(() => {
    try {
      window.dispatchEvent(new Event('video:close'));
    } catch {
      // ignore
    }
  }, []);

  const openModal = useCallback(
    (v: VideoItem) => {
      setActive(v);
      setModalVideo(v);
      setModalMounted(true);
      const s = v.slug || v.id || null;
      if (s) announceOpen(String(s));
    },
    [announceOpen]
  );

  const closeModal = useCallback(() => {
    setActive(null);
    announceClose();
  }, [announceClose]);

  const initialPage: PageResult<VideoItem> = useMemo(
    () =>
      initial ?? {
        items: items ?? [],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    [initial, items]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('v');
      if (!v) return;
      const found = initialPage.items?.find((it) => it.slug === v || it.id === v) ?? null;
      if (found) openModal(found);
    } catch {
      // ignore parsing errors
    }
  }, [initialPage.items, openModal]);

  useEffect(() => {
    if (!active) {
      lastListKeyRef.current = listKey;
      return;
    }
    // Only close the modal when filters actually change; avoid closing on initial mount
    if (listKey && lastListKeyRef.current && listKey !== lastListKeyRef.current) {
      closeModal();
    }
    lastListKeyRef.current = listKey;
  }, [listKey, active, closeModal]);

  return (
    <>
      <InfiniteList
        kind="video"
        initial={initialPage}
        filters={filters}
        pageSize={pageSize}
        gridClass="mt-8"
        onVideoOpen={openModal}
      />

      {modalMounted ? (
        <VideoModal video={modalVideo} isOpen={Boolean(active)} onClose={closeModal} />
      ) : null}
    </>
  );
}
