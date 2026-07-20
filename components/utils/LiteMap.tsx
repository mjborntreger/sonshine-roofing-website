// components/LiteMap.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

const PLACE_ID = 'ChIJIyB9mBBHw4gRWOl1sU9ZGFM';
const EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

type LiteMapProps = {
  addressQuery: string;
  brandName: string;
  googleBusinessProfile?: string | null;
};

export default function LiteMap({ addressQuery, brandName, googleBusinessProfile }: LiteMapProps) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Lazy-activate when the block nears viewport (fast + CLS-safe)
  useEffect(() => {
    const el = ref.current;
    if (!el || active) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              setActive(true);
              io.disconnect();
            }
          });
        },
        { rootMargin: '200px 0px' },
      );
      io.observe(el);
      return () => io.disconnect();
    }

    // Fallback for very old browsers
    if (typeof window === 'undefined') return;

    const win = window as Window & typeof globalThis;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = win.innerHeight;
      if (rect.top < viewportHeight + 200) {
        setActive(true);
        win.removeEventListener('scroll', onScroll);
      }
    };
    onScroll();
    win.addEventListener('scroll', onScroll);
    return () => win.removeEventListener('scroll', onScroll);
  }, [active]);

  // Prefer the official Maps Embed API (requires key+billing) using Place ID.
  // Fallback to a no-key embed with a plain address query (supported by Google).
  const src = EMBED_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${EMBED_KEY}&q=place_id:${PLACE_ID}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}&output=embed`;

  return (
    <div ref={ref} id="map-lite" className="card overflow-hidden">
      {active ? (
        <iframe
          src={src}
          title={`Map to ${brandName}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full aspect-[16/9] border-0"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="w-full aspect-[16/9] bg-slate-100 text-slate-600 grid place-items-center"
          aria-label="Load interactive map"
        >
          View interactive map
        </button>
      )}
      <noscript>
        <a
          href={
            googleBusinessProfile ??
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps
        </a>
      </noscript>
    </div>
  );
}
