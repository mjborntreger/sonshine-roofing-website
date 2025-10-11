"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  title: string;
  videoId: string;
  className?: string;
  posterUrl?: string;
  posterAlt?: string;
};

export default function ProjectVideo({ title, videoId, className, posterUrl, posterAlt }: Props) {
  const [open, setOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const scrollYRef = useRef(0);

  // focus trap refs
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // scroll lock + ESC + focus trap (no scroll yank on close)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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

    if (open) {
      // store current focus & scroll; lock scroll without yank
      previouslyFocused.current = document.activeElement as HTMLElement | null;
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
      // restore scroll & focus without jumping the page
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
        if (el) {
          try {
            el.focus({ preventScroll: true });
          } catch {
            el.focus();
          }
        }
        previouslyFocused.current = null;
      });
    }

    return () => {
      // cleanup on unmount or prop changes
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const youtubeThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const facadeSrc = posterUrl?.trim() ? posterUrl.trim() : youtubeThumb;
  const facadeAlt = posterAlt?.trim() || title;

  // springPop animation preset
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
      {/* Facade */}
      <button
        type="button"
        aria-label={`Play video: ${title}`}
        onClick={() => setOpen(true)}
        className={`relative block w-full overflow-hidden rounded-2xl ${className ?? ""}`}
      >
        <Image
          src={facadeSrc}
          alt={facadeAlt}
          width={1280}
          height={720}
          sizes="(max-width: 1280px) 100vw, 768px"
          className="aspect-video w-full object-cover"
          priority={false}
        />
        {/* Play overlay */}
        <span className="absolute inset-0 grid place-items-center bg-black/0 transition hover:bg-black/15">
          <span className="grid place-items-center rounded-full bg-white/90 p-4 shadow-md">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-slate-900">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </button>

      {/* Modal (portaled to body so it covers header/footer and ignores transformed ancestors) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="backdrop"
                className="fixed inset-0 z-[1000]"
                aria-modal="true"
                role="dialog"
                aria-label={title}
                initial={A.backdrop.initial}
                animate={A.backdrop.animate}
                exit={A.backdrop.exit}
              >
                {/* Dim background */}
                <motion.div
                  className="absolute inset-0 bg-black/70"
                  initial={A.backdrop.initial}
                  animate={A.backdrop.animate}
                  exit={A.backdrop.exit}
                />

                <button
                  ref={closeBtnRef}
                  type="button"
                  aria-label="Close"
                  onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                  className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] md:top-[max(1.25rem,env(safe-area-inset-top))] md:right-[max(1.25rem,env(safe-area-inset-right))] rounded-full bg-slate-900/80 text-white p-2.5 shadow-lg backdrop-blur-sm transition hover:bg-slate-900/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-blue]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Modal shell */}
                <div
                  className="absolute inset-0 flex items-center justify-center p-4"
                  onPointerDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
                  onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
                >
                  <motion.div
                    ref={modalRef}
                    className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-xl"
                    initial={A.modal.initial}
                    animate={A.modal.animate}
                    exit={A.modal.exit}
                  >
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                      title={title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
