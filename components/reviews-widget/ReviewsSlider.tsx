'use client';

import AutoScroll from 'embla-carousel-auto-scroll';
import EmblaCarousel, { type EmblaOptionsType } from 'embla-carousel';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import SmartLink from '../utils/SmartLink';
import { ArrowUpRight, Quote } from 'lucide-react';
import Image from 'next/image';
import type { Review } from './types';
import { OWNER_RESPONSE_IMAGE } from './constants';

const ordinalize = (day: number): string => {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
};

const formatReviewDate = (time?: number | null, fallback?: string | null | undefined): string | null => {
  if (typeof time === 'number' && Number.isFinite(time) && time > 0) {
    const date = new Date(time * 1000);
    if (!Number.isNaN(date.getTime())) {
      const month = date.toLocaleString('en-US', { month: 'long' });
      const day = ordinalize(date.getDate());
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    }
  }
  return fallback?.trim() || null;
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
    <div className="relative w-full embla isolate">
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
        className="absolute top-0 z-10 w-screen h-full -translate-x-1/2 pointer-events-none left-1/2"
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
        className="px-5 py-3 overflow-x-hidden overflow-y-visible embla__viewport"
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
        <div className="embla__container ml-[-1rem] items-start flex flex-nowrap will-change-transform">
          {reviews.map((r, i) => {
            const text = r.text?.length > 250 ? r.text.slice(0, 250) + '…' : r.text || '';
            const formattedDate = formatReviewDate(r.time, r.relative_time_description);
            return (
              <button
                key={i}
                type="button"
                onClick={() => openModal(i)}
                aria-label={`Open full review by ${r.author_name}`}
                className="embla__slide block relative pl-4 shrink-0 min-w-0 flex-[0_0_80%] md:flex-[0_0_33%] lg:flex-[0_0_25%] appearance-none py-4 m-0 text-left cursor-pointer"
              >
                <article className="h-full rounded-3xl border border-blue-300 bg-cyan-50 p-5 shadow-md transition-transform duration-200 ease-out hover:translate-y-[-2px] hover:scale-[1.006] hover:shadow-xl hover:border-[#fb9216] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00e3fe]">
                  <header className="mb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="flex items-start gap-2 m-0 text-xl font-bold text-slate-700">
                          <Image
                            src="https://next.sonshineroofing.com/wp-content/uploads/google.webp"
                            alt="Google logo"
                            width={40}
                            height={40}
                            className="flex-none w-5 h-5"
                          />
                          <span>{r.author_name}</span>
                        </h3>
                        <div className="my-2 flex items-center gap-1 text-[#fb9216]">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <svg key={j} viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden>
                              <path d="M12 .587l3.668 7.431L24 9.753l-6 5.847L19.336 24 12 20.125 4.664 24 6 15.6 0 9.753l8.332-1.735z" />
                            </svg>
                        ))}
                      </div>
                      {formattedDate && (
                        <div className="mt-1 text-xs text-slate-500">{formattedDate}</div>
                      )}
                    </div>
                    <Quote className="flex-none w-10 h-10 mt-1 text-[--brand-cyan]" aria-hidden />
                  </div>
                </header>
                <p className="text-md md:text-lg text-slate-700">{text}</p>
                {r.ownerReply ? (
                  <div className="mt-6 rounded-2xl border border-blue-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Image
                        src={OWNER_RESPONSE_IMAGE}
                        alt="Owner response avatar"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full border border-[--brand-cyan] object-cover"
                        loading="lazy"
                      />
                      <div>
                        <p className="pt-2 text-md font-semibold text-slate-700">Nathan Borntreger</p>
                        <span className="pb-2 text-xs text-slate-500">Owner</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{r.ownerReply}</p>
                  </div>
                ) : null}
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
          const formattedDate = formatReviewDate(r.time, r.relative_time_description);
          return (
            <div
              className="fixed inset-0 z-[2147483647] grid place-items-center bg-black/45 py-16 md:p-16"
              onClick={closeModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-title"
                className="relative w-full max-w-[720px] mx-4 md:mx-0 overflow-hidden rounded-3xl border border-blue-300 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  ref={closeBtnRef}
                  type="button"
                  aria-label="Close review"
                  className="absolute flex items-center justify-center w-8 h-8 right-3 top-3"
                  onClick={closeModal}
                >
                  <svg viewBox="0 0 24 24" className="text-red-600 w-6 h-6" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <header className="px-5 pt-4 pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 id="review-title" className="flex items-center gap-2 m-0 text-2xl font-bold text-slate-700">
                        <Image
                          src="https://next.sonshineroofing.com/wp-content/uploads/google.webp"
                          alt="Google logo"
                          width={40}
                          height={40}
                          className="flex-none w-5 h-5"
                        />
                        <span>{r.author_name}</span>
                      </h4>
                      <div className="my-3 flex gap-1 text-[#fb9216]">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <svg key={j} viewBox="0 0 24 24" className="fill-current h-7 w-7" aria-hidden>
                            <path d="M12 .587l3.668 7.431L24 9.753l-6 5.847L19.336 24 12 20.125 4.664 24 6 15.6 0 9.753l8.332-1.735z" />
                          </svg>
                        ))}
                      </div>
                      {formattedDate && (
                        <div className="mt-1 text-xs md:text-sm text-slate-500">{formattedDate}</div>
                      )}
                    </div>
                  </div>
                </header>
                <div className="max-h-[60vh] overflow-auto px-5 pb-4 pt-1 space-y-4">
                  <p className="m-0 leading-7 whitespace-pre-wrap text-md md:text-lg text-slate-700">{r.text || ''}</p>
                  {r.ownerReply ? (
                    <div className="mt-6 rounded-2xl border border-blue-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <Image
                          src={OWNER_RESPONSE_IMAGE}
                          alt="Owner response avatar"
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full border border-[--brand-cyan] object-cover"
                          loading="lazy"
                        />
                        <div>
                          <p className="pt-2 text-md font-semibold text-slate-700">Nathan Borntreger</p>
                          <span className="pb-2 text-xs text-slate-500">Owner</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{r.ownerReply}</p>
                    </div>
                  ) : null}
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-blue-300">
                  <SmartLink
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center rounded-full bg-[--brand-blue] px-4 py-2 font-semibold text-white hover:opacity-90"
                    data-icon-affordance="up-right"
                  >
                    View on Google
                    <ArrowUpRight className="inline w-4 h-4 ml-2 icon-affordance" />
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
