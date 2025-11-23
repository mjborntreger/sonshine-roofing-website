"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import type { WpImage } from "@/lib/content/wp";
import { PROJECT_GALLERY_DEFAULT_HEIGHT, PROJECT_GALLERY_DEFAULT_WIDTH } from "./galleryConfig";

type ProjectGalleryProps = {
  images: WpImage[];
  projectTitle: string;
};

const imageClassBase =
  "pointer-events-none select-none object-cover transition-opacity duration-500 ease-out";

const containerBase = "relative overflow-hidden rounded-3xl border border-blue-200 bg-slate-100";

export default function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  const [mounted, setMounted] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);
  const scrollYRef = React.useRef(0);

  const totalImages = images.length;
  const hasImages = totalImages > 0;
  const isOpen = activeIndex !== null;
  const currentImage = typeof activeIndex === "number" ? images[activeIndex] : null;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setActiveIndex(null);
  }, []);

  const goPrev = React.useCallback(() => {
    if (totalImages < 2) return;
    setActiveIndex((idx) => {
      if (idx === null) return idx;
      return (idx - 1 + totalImages) % totalImages;
    });
  }, [totalImages]);

  const goNext = React.useCallback(() => {
    if (totalImages < 2) return;
    setActiveIndex((idx) => {
      if (idx === null) return idx;
      return (idx + 1) % totalImages;
    });
  }, [totalImages]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const isShift = e.shiftKey;
        const el = document.activeElement as HTMLElement | null;
        if (!isShift && el === last) {
          e.preventDefault();
          first.focus();
        } else if (isShift && el === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    const body = document.body;

    if (isOpen) {
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
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeModal, goNext, goPrev]);

  const modalComponent =
    mounted && currentImage
      ? createPortal(
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                key="project-gallery-lightbox"
                className="fixed inset-0 z-[1000]"
                role="dialog"
                aria-modal="true"
                aria-label="Project photo viewer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-black/75 backdrop-blur-[1px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />

                <button
                  ref={closeBtnRef}
                  type="button"
                  aria-label="Close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeModal();
                  }}
                  className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] md:top-[max(1.25rem,env(safe-area-inset-top))] md:right-[max(1.25rem,env(safe-area-inset-right))] rounded-full bg-slate-900/80 text-white p-2.5 shadow-lg backdrop-blur-sm transition hover:bg-slate-900/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-blue]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>

                <div
                  className="absolute inset-0 flex items-center justify-center p-4"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      e.preventDefault();
                      e.stopPropagation();
                      closeModal();
                    }
                  }}
                >
                  <motion.div
                    ref={modalRef}
                    className="relative flex w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl bg-slate-950 shadow-xl"
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: { type: "spring", stiffness: 260, damping: 24 },
                    }}
                    exit={{ opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.15 } }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LightboxImage image={currentImage} projectTitle={projectTitle} />

                    {totalImages > 1 ? (
                      <>
                        <NavButton side="left" ariaLabel="Previous photo" onClick={goPrev}>
                          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                        </NavButton>
                        <NavButton side="right" ariaLabel="Next photo" onClick={goNext}>
                          <ChevronRight className="h-6 w-6" aria-hidden="true" />
                        </NavButton>
                      </>
                    ) : null}
                  </motion.div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )
      : null;

  if (!hasImages) return null;

  return (
    <section aria-label="Project Photos" className="not-prose space-y-4 mt-16 p-6 bg-white rounded-3xl shadow-md border border-blue-200">
      <h2 className="text-xl md:text-3xl">Photo Gallery</h2>
      <p className="text-xs flex items-center gap-2 md:text-sm text-slate-500" aria-live="off">
        <span>Tap to expand an image</span>
        <Expand className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
      </p>
      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <GalleryImage
            key={`${image.url}-${index}`}
            image={image}
            projectTitle={projectTitle}
            onOpen={() => setActiveIndex(index)}
          />
        ))}
      </div>
      {modalComponent}
    </section>
  );
}

type GalleryImageProps = {
  image: WpImage;
  projectTitle: string;
  onOpen: () => void;
};

function GalleryImage({ image, projectTitle, onOpen }: GalleryImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const handleLoad = React.useCallback(() => setLoaded(true), []);
  const width = image.width ?? PROJECT_GALLERY_DEFAULT_WIDTH;
  const height = image.height ?? PROJECT_GALLERY_DEFAULT_HEIGHT;
  const aspectStyle: React.CSSProperties = { aspectRatio: `${width} / ${height}` };
  const alt = image.altText || projectTitle;

  React.useEffect(() => {
    setLoaded(false);
    const imgEl = imageRef.current;
    if (imgEl?.complete) {
      handleLoad();
    }
  }, [image.url, handleLoad]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${containerBase} shadow-md group block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--brand-blue]`}
      style={aspectStyle}
      aria-label={`Open photo: ${alt}`}
    >
      {!loaded ? <Skeleton className="pointer-events-none absolute inset-0 h-full w-full" /> : null}
      <Image
        ref={imageRef}
        src={image.url}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={`${imageClassBase} ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={handleLoad}
        loading="lazy"
      />
      <span
        className="pointer-events-none absolute inset-0 grid place-items-center bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 transition duration-200 ease-out group-active:opacity-100 group-focus-visible:opacity-100 group-hover:opacity-100"
        aria-hidden="true"
      >
        <span className="flex items-center justify-center rounded-full bg-white/90 p-3 text-slate-900 shadow-sm transition group-active:scale-105 group-hover:scale-105">
          <Expand className="h-5 w-5" />
        </span>
      </span>
    </button>
  );
}

function LightboxImage({ image, projectTitle }: { image: WpImage; projectTitle: string }) {
  const width = image.width ?? PROJECT_GALLERY_DEFAULT_WIDTH;
  const height = image.height ?? PROJECT_GALLERY_DEFAULT_HEIGHT;
  const aspectStyle: React.CSSProperties = {
    aspectRatio: `${width} / ${height}`,
    maxHeight: "85vh",
    maxWidth: "95vw",
  };

  return (
    <div className="relative w-full max-w-5xl" style={aspectStyle}>
      <Image
        src={image.url}
        alt={image.altText || projectTitle}
        fill
        sizes="100vw"
        priority={false}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

type NavButtonProps = {
  side: "left" | "right";
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
};

function NavButton({ side, ariaLabel, onClick, children }: NavButtonProps) {
  const positionClass =
    side === "left"
      ? "left-3 md:left-5"
      : "right-3 md:right-5";
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-slate-900 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-blue] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${positionClass}`}
    >
      {children}
    </button>
  );
}
