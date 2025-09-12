'use client';

import AutoScroll from 'embla-carousel-auto-scroll';
import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const autoScroll = useRef(
    AutoScroll({ speed: 1, startDelay: 0, stopOnInteraction: false, stopOnMouseEnter: false })
  );

  // Embla
  const [viewportRef, embla] = useEmblaCarousel(
    { align: 'start', loop: true, containScroll: 'keepSnaps', dragFree: true },
    [autoScroll.current]
  );

  // Pagination state (use actual snap count)
  const [selected, setSelected] = useState(0);
  const [dotCount, setDotCount] = useState(0);

  // Modal state
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const scrollYRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Embla events
  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    const onReInit = () => setDotCount(embla.scrollSnapList().length);
    embla.on('select', onSelect);
    embla.on('reInit', onReInit);
    onSelect();
    onReInit();
    return () => {
      embla.off('select', onSelect);
      embla.off('reInit', onReInit);
    };
  }, [embla]);

  const openModal = (i: number) => {
    setModalIndex(i);
    embla?.plugins()?.autoScroll?.stop();
  };
  const closeModal = () => {
    setModalIndex(null);
    embla?.plugins()?.autoScroll?.play();
  };

  // Body scroll lock + focus + ESC + modal left/right nav
  useEffect(() => {
    if (modalIndex === null) return;

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

    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

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
      const prevScrollBehavior = htmlEl.style.scrollBehavior;
      htmlEl.style.scrollBehavior = 'auto';
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.left = prev.left;
      document.body.style.right = prev.right;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;
      document.body.style.paddingRight = prev.paddingRight;
      window.scrollTo(0, scrollYRef.current);
      htmlEl.style.scrollBehavior = prevScrollBehavior;
    };
  }, [modalIndex, reviews.length]);

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
        style={{
          // Customize the fade color here to match the section background
          ['--reviews-fade-color' as any]: 'var(--reviews-fade-color, #00e3fe)',
          // Customize fade width here
          ['--reviews-fade-width' as any]: '24px',
        }}
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
            'linear-gradient(to right, transparent, black var(--reviews-fade-width, 56px), black calc(100% - var(--reviews-fade-width, 56px)), transparent)',
          maskImage:
            'linear-gradient(to right, transparent, black var(--reviews-fade-width, 56px), black calc(100% - var(--reviews-fade-width, 56px)), transparent)',
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
                <article className="h-full rounded-2xl border border-slate-400 bg-white p-5 shadow-md transition-transform duration-200 ease-out hover:translate-y-[-2px] hover:scale-[1.006] hover:shadow-xl hover:border-[#fb9216] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00e3fe]">
                  <header className="mb-2">
                    <h4 className="m-0 font-bold text-slate-900">{r.author_name}</h4>
                    <div className="mt-1 flex items-center gap-1 text-[#fb9216]">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <svg key={j} viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                          <path d="M12 .587l3.668 7.431L24 9.753l-6 5.847L19.336 24 12 20.125 4.664 24 6 15.6 0 9.753l8.332-1.735z" />
                        </svg>
                      ))}
                    </div>
                    {r.relative_time_description && (
                      <div className="mt-1 text-xs text-slate-500">{r.relative_time_description}</div>
                    )}
                  </header>
                  <p className="text-[0.95rem] leading-6 text-slate-700">{text}</p>
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
              className="fixed inset-0 z-[2147483647] grid place-items-center bg-black/45 p-4"
              onClick={closeModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-title"
                className="relative w-full max-w-[720px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  ref={closeBtnRef}
                  type="button"
                  aria-label="Close review"
                  className="absolute right-3 top-2 h-8 w-8 rounded-full border border-slate-300 bg-white text-slate-900 flex items-center justify-center"
                  onClick={closeModal}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <header className="px-5 pt-4 pb-2">
                  <h4 id="review-title" className="m-0 text-lg font-extrabold text-slate-900">
                    {r.author_name}
                  </h4>
                  <div className="mt-1 flex gap-1 text-[#fb9216]">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                        <path d="M12 .587l3.668 7.431L24 9.753l-6 5.847L19.336 24 12 20.125 4.664 24 6 15.6 0 9.753l8.332-1.735z" />
                      </svg>
                    ))}
                  </div>
                  {r.relative_time_description && (
                    <div className="mt-1 text-sm text-slate-500">{r.relative_time_description}</div>
                  )}
                </header>
                <div className="max-h-[60vh] overflow-auto px-5 pb-4 pt-1">
                  <p className="m-0 text-base leading-7 text-slate-700 whitespace-pre-wrap">{r.text || ''}</p>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-300 px-5 py-3">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center rounded-md bg-[#0045d7] px-3 py-2 font-semibold text-white hover:opacity-90"
                  >
                    View on Google
                  </a>
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
