// app/video-library/video-grid.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import InfiniteList from "@/components/InfiniteList";
import type { VideoItem } from "@/lib/wp";
import type { PageResult } from "@/lib/pagination";

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
}: {
  initial?: PageResult<VideoItem>;
  items?: VideoItem[];
  filters?: Record<string, unknown>;
  pageSize?: number;
}) {
  const [active, setActive] = useState<VideoItem | null>(null);
  const scrollYRef = useRef(0);
  const [mounted, setMounted] = useState(false);

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
      const s = v.slug || v.id || null;
      if (s) announceOpen(String(s));
    },
    [announceOpen]
  );

  const closeModal = useCallback(() => {
    setActive(null);
    announceClose();
  }, [announceClose]);

  // Normalize initial page data for InfiniteList
  const initialPage: PageResult<VideoItem> = initial ?? {
    items: items ?? [],
    pageInfo: { hasNextPage: false, endCursor: null },
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('v');
      if (!v) return;
      const found = initialPage.items?.find((it) => it.slug === v || it.id === v) ?? null;
      if (found) setActive(found);
    } catch {
      // ignore parsing errors
    }
  }, [initialPage.items]);

  // Focus trap refs
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeModal(); }
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const isShift = e.shiftKey;
        const el = document.activeElement as HTMLElement | null;
        if (!isShift && el === last) { e.preventDefault(); first.focus(); }
        else if (isShift && el === first) { e.preventDefault(); last.focus(); }
      }
    };

      const body = document.body;

    if (active) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      // Store current scroll and lock the body in place (iOS-friendly)
      scrollYRef.current = window.scrollY || window.pageYOffset || 0;
      body.style.position = "fixed";
      body.style.top = `-${scrollYRef.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";

      window.addEventListener("keydown", onKey);
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    } else {
      // Restore body scroll first, then focus without causing a jump
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";

      window.removeEventListener("keydown", onKey);
      const y = scrollYRef.current || 0;
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, left: 0 });
        html.style.scrollBehavior = prevBehavior;
        const el = previouslyFocused.current;
        try { el?.focus?.({ preventScroll: true }); }
        catch {
          try { el?.focus?.(); } catch { /* ignore */ }
        }
        previouslyFocused.current = null;
      });
    }

    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, closeModal]);

  // springPop animation
  const A = {
    backdrop: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    modal: {
      initial: { opacity: 0, scale: 0.96, y: 8 },
      animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 260, damping: 24 },
      },
      exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.15 } },
    },
  } as const;

  return (
    <>
      <InfiniteList
        kind="video"
        initial={initialPage}
        filters={filters}
        pageSize={pageSize}
        gridClass="mt-4 grid gap-6 grid-cols-1 md:grid-cols-2"
        onVideoOpen={openModal}
      />

      {mounted &&
        createPortal(
          <AnimatePresence>
            {active && (
              <motion.div
                key="backdrop"
                className="fixed inset-0 z-[1000] overscroll-contain"
                aria-modal="true"
                role="dialog"
                aria-label={active.title}
                initial={A.backdrop.initial}
                animate={A.backdrop.animate}
                exit={A.backdrop.exit}
              >
                {/* Backdrop */}
                <motion.div
                  className="absolute inset-0 bg-black/70"
                  initial={A.backdrop.initial}
                  animate={A.backdrop.animate}
                  exit={A.backdrop.exit}
                />

                {/* Modal */}
                <div
                  ref={modalRef}
                  className="absolute inset-0 flex items-center justify-center p-4"
                  onPointerDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                  onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                >
                  <motion.div
                    className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-xl"
                    initial={A.modal.initial}
                    animate={A.modal.animate}
                    exit={A.modal.exit}
                  >
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                      title={active.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </motion.div>
                  <button
                    ref={closeBtnRef}
                    type="button"
                    aria-label="Close"
                    onClick={(e) => { e.stopPropagation(); closeModal(); }}
                    className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] md:top-[max(1.25rem,env(safe-area-inset-top))] md:right-[max(1.25rem,env(safe-area-inset-right))] rounded-full bg-slate-900/80 text-white p-2.5 shadow-lg backdrop-blur-sm transition hover:bg-slate-900/90 focus:outline-none focus:ring-2"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
