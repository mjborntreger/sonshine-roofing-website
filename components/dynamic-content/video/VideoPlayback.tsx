'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import type { VideoItem } from '@/lib/content/wp';
import type { PlaybackVideo } from './VideoModal';

const VideoModal = dynamic<{ video: PlaybackVideo | null; isOpen: boolean; onClose: () => void }>(
  () => import('./VideoModal'),
  { ssr: false },
);

function updateVideoUrl(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set('v', slug);
  else url.searchParams.delete('v');
  if (url.href === window.location.href) return;
  // Next's native history integration also updates the modal and share bar's URL hooks.
  window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

/** Keeps shared-video playback mounted independently of archive results, including empty searches. */
export default function VideoPlayback({
  playbackVideos,
  children,
}: {
  playbackVideos: PlaybackVideo[];
  children: (openVideo: (video: VideoItem) => void) => ReactNode;
}) {
  const searchParams = useSearchParams();
  const selected = (searchParams?.get('v') ?? '').trim();
  const [openedVideos, setOpenedVideos] = useState<PlaybackVideo[]>([]);
  const [modalVideo, setModalVideo] = useState<PlaybackVideo | null>(null);

  const openModal = useCallback((v: VideoItem) => {
    // Keep videos fetched by pagination available to browser history for this visit.
    setOpenedVideos((previous) =>
      previous.some((item) => item.id === v.id) ? previous : [...previous, v],
    );
    updateVideoUrl(v.slug || v.id || null);
  }, []);

  const closeModal = useCallback(() => {
    updateVideoUrl(null);
  }, []);

  const active = useMemo(() => {
    if (!selected) return null;
    return (
      [...openedVideos, ...playbackVideos].find(
        (video) => video.slug === selected || video.id === selected,
      ) ?? null
    );
  }, [selected, openedVideos, playbackVideos]);

  useEffect(() => {
    // Retain the last video while the existing modal finishes its exit animation.
    // Restoring the URL is read-only; only explicit open/close actions write history.
    if (active) setModalVideo(active);
  }, [active]);

  return (
    <>
      {children(openModal)}

      {active || modalVideo ? (
        <VideoModal video={active ?? modalVideo} isOpen={Boolean(active)} onClose={closeModal} />
      ) : null}
    </>
  );
}
