'use client';

import AutoScroll from 'embla-carousel-auto-scroll';
import EmblaCarousel, { type EmblaOptionsType } from 'embla-carousel';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import SmartLink from './SmartLink';
import { ArrowUpRight, Quote } from 'lucide-react';
import Image from 'next/image';

type Review = {
  author_name: string;
  author_url?: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description?: string;
};

export default function ReviewsSlider({
  reviews,
  gbpUrl,
}: {
  reviews: Review[];
  gbpUrl: string;
}) {
  // Continuous auto-scroll (linear), infinite loop, pause on hover
  const autoScrollOptions = useMemo(
    () => ({ speed: 1, startDelay: 0, stopOnInteraction: false, stopOnMouseEnter: false }),
    []
  );

  const emblaOptions = useMemo<EmblaOptionsType>(
    () => ({ align: 'start', loop: true, containScroll: 'keepSnaps', dragFree: true }),
    []
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const autoScrollPluginRef = useRef<ReturnType<typeof AutoScroll> | null>(null);

  useEffect(() => {
    if (!viewportRef.current) return;

    const autoScrollPlugin = AutoScroll(autoScrollOptions);
    autoScrollPluginRef.current = autoScrollPlugin;
    const emblaInstance = EmblaCarousel(
      viewportRef.current,
      emblaOptions,
      [autoScrollPlugin]
    );

    return () => {
      autoScrollPluginRef.current = null;
      emblaInstance.destroy();
    };
  }, [autoScrollOptions, emblaOptions]);

  // Modal state
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const scrollYRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fadeOverlayStyle = useMemo(() => {
    type FadeStyle = CSSProperties & {
      "--reviews-fade-color": string;
      "--reviews-fade-width": string;
    };
    return {
      "--reviews-fade-color": "var(--reviews-fade-color, #00e3fe)",
      "--reviews-fade-width": "24px",
    } as FadeStyle;
  }, []);

  const openModal = useCallback((i: number) => {
    setModalIndex(i);
    autoScrollPluginRef.current?.stop();
  }, []);

  const closeModal = useCallback(() => {
    setModalIndex(null);
    autoScrollPluginRef.current?.play();
  }, []);

  // Body scroll lock + focus + ESC + modal left/right nav
  useEffect(() => {
    if (modalIndex === null) return;

    const htmlEl = document.documentElement;
    scrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0;

    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };

    const prevHtml = {
      scrollBehavior: htmlEl.style.scrollBehavior,
      scrollLock: htmlEl.dataset.scrollLock,
      scrollLockOffset: htmlEl.style.getPropertyValue('--scroll-lock-offset'),
    };

    const scrollbar = window.innerWidth - htmlEl.clientWidth;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    htmlEl.dataset.scrollLock = 'true';
    htmlEl.style.setProperty('--scroll-lock-offset', `${scrollbar}px`);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setModalIndex((idx) => {
          const cur = idx ?? 0;
          return (cur + 1) % reviews.length;
        });
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setModalIndex((idx) => {
          const cur = idx ?? 0;
          return (cur - 1 + reviews.length) % reviews.length;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
      // Temporarily disable smooth scroll so restore doesn't animate
      const htmlEl = document.documentElement;
      htmlEl.style.scrollBehavior = 'auto';
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.right = prev.right;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;
      document.body.style.paddingRight = prev.paddingRight;
      window.scrollTo(0, scrollYRef.current);
      if (prevHtml.scrollLock) {
        htmlEl.dataset.scrollLock = prevHtml.scrollLock;
      } else {
        delete htmlEl.dataset.scrollLock;
      }
      if (prevHtml.scrollLockOffset) {
        htmlEl.style.setProperty('--scroll-lock-offset', prevHtml.scrollLockOffset);
      } else {
        htmlEl.style.removeProperty('--scroll-lock-offset');
      }
      htmlEl.style.scrollBehavior = prevHtml.scrollBehavior;
    };
  }, [closeModal, modalIndex, reviews.length]);

  return (
    <div className="embla relative w-full isolate py-6 md:py-8">
      {/**
       * Edge Fades (full-bleed to viewport)
       *
       * - Adjust `--reviews-fade-color` to match your section background.
       *   Default: brand cyan-like shade. If your section uses a gradient,
       *   pick the color that sits directly behind the slider edges so the
       *   fade blends seamlessly.
       * - Adjust `--reviews-fade-width` to control fade width.
       *   Example values: `48px`, `72px`, `10vw`.
       *
       * These overlays extend to the viewport width (w-screen) so the fade
       * reaches the true page edges even when the slider is inside a
       * constrained container.
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-screen -translate-x-1/2"
        style={fadeOverlayStyle}
      >
        {/* Left overlay: solid bg color at the extreme edge -> transparent toward content */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: 'var(--reviews-fade-width)',
            background: 'linear-gradient(to right, var(--reviews-fade-color), rgba(0,0,0,0))',
          }}
        />
        {/* Right overlay */}
        <div
          className="absolute inset-y-0 right-0"
          style={{
            width: 'var(--reviews-fade-width)',
            background: 'linear-gradient(to left, var(--reviews-fade-color), rgba(0,0,0,0))',
          }}
        />
      </div>
      {/* Viewport with gutters + mask fade; spacing uses padding model */}
      <div
        className="embla__viewport overflow-x-hidden overflow-y-visible px-5 py-3"
        ref={viewportRef}
        style={{
          // Content mask (optional): softly fade the slider contents themselves at the edges
          // so the overlay above has no visible hard seam.
          // Adjust the same variable for consistent widths.
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black var(--reviews-fade-width, 56px), black calc(100% - var(--reviews-fade-width, 28px)), transparent)',
          maskImage:
            'linear-gradient(to right, transparent, black var(--reviews-fade-width, 56px), black calc(100% - var(--reviews-fade-width, 28px)), transparent)',
        }}
      >
        <div className="embla__container ml-[-1rem] flex flex-nowrap will-change-transform">
          {reviews.map((r, i) => {
            const text = r.text?.length > 250 ? r.text.slice(0, 250) + '…' : r.text || '';
            return (
              <button
                key={i}
                type="button"
                onClick={() => openModal(i)}
                aria-label={`Open full review by ${r.author_name}`}
                className="embla__slide block relative pl-4 shrink-0 min-w-0 flex-[0_0_80%] md:flex-[0_0_33%] lg:flex-[0_0_25%] appearance-none bg-transparent p-0 m-0 text-left cursor-pointer"
              >
                <article className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-md transition-transform duration-200 ease-out hover:translate-y-[-2px] hover:scale-[1.006] hover:shadow-xl hover:border-[#fb9216] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00e3fe]">
                  <header className="mb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="m-0 flex items-center gap-2 font-bold text-xl text-slate-700">
                          <Image
                            src="https://next.sonshineroofing.com/wp-content/uploads/google.webp"
                            alt="Google logo"
                            width={40}
                            height={40}
                            className="h-5 w-5 flex-none"
                          />
                          <span>{r.author_name}</span>
                        </h3>
                        <div className="my-2 flex items-center gap-1 text-[#fb9216]">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <svg key={j} viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                              <path d="M12 .587l3.668 7.431L24 9.753l-6 5.847L19.336 24 12 20.125 4.664 24 6 15.6 0 9.753l8.332-1.735z" />
                            </svg>
                          ))}
                        </div>
                        {r.relative_time_description && (
                          <div className="mt-1 text-xs text-slate-500">{r.relative_time_description}</div>
                        )}
                      </div>
                      <Quote className="mt-1 h-7 w-7 flex-none text-slate-300" aria-hidden />
                    </div>
                  </header>
                  <p className="text-md md:text-lg leading-7 text-slate-700">{text}</p>
                </article>
              </button>
            );
          })}
        </div>
      </div>



      {/* Modal via portal to avoid transformed ancestor / z-index issues */}
      {mounted && modalIndex !== null && createPortal(
        (() => {
          const r = reviews[modalIndex]!;
          const href = r.author_url || gbpUrl;
          return (
            <div
              className="fixed inset-0 z-[2147483647] grid place-items-center bg-black/45 p-16"
              onClick={closeModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-title"
                className="relative w-full max-w-[720px] overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  ref={closeBtnRef}
                  type="button"
                  aria-label="Close review"
                  className="absolute right-3 top-3 h-8 w-8 text-slate-800 flex items-center justify-center"
                  onClick={closeModal}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <header className="px-5 pt-4 pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 id="review-title" className="m-0 flex items-center gap-2 text-2xl font-bold text-slate-700">
                        <Image
                          src="https://next.sonshineroofing.com/wp-content/uploads/google.webp"
                          alt="Google logo"
                          width={40}
                          height={40}
                          className="h-5 w-5 flex-none"
                        />
                        <span>{r.author_name}</span>
                      </h4>
                      <div className="my-3 flex gap-1 text-[#fb9216]">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <svg key={j} viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden>
                            <path d="M12 .587l3.668 7.431L24 9.753l-6 5.847L19.336 24 12 20.125 4.664 24 6 15.6 0 9.753l8.332-1.735z" />
                          </svg>
                        ))}
                      </div>
                      {r.relative_time_description && (
                        <div className="mt-1 text-xs md:text-sm text-slate-500">{r.relative_time_description}</div>
                      )}
                    </div>
                  </div>
                </header>
                <div className="max-h-[60vh] overflow-auto px-5 pb-4 pt-1">
                  <p className="m-0 text-md md:text-lg leading-7 text-slate-700 whitespace-pre-wrap">{r.text || ''}</p>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-300 p-4">
                  <SmartLink
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center rounded-full bg-[--brand-blue] px-4 py-2 font-semibold text-white hover:opacity-90"
                    data-icon-affordance="up-right"
                  >
                    View on Google
                    <ArrowUpRight className="icon-affordance h-4 w-4 inline ml-2" />
                  </SmartLink>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}
