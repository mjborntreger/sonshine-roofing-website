'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';

type Review = {
  author_name: string;
  author_url?: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description?: string;
};

type Props = {
  reviews: Review[];
  gbpUrl: string;
};

export default function ReviewsSliderLazy({ reviews, gbpUrl }: Props) {
  const [Slider, setSlider] = useState<ComponentType<Props> | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || shouldLoad) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || Slider) return;
    let cancelled = false;

    import('./ReviewsSlider').then(mod => {
      if (!cancelled) setSlider(() => mod.default);
    });

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, Slider]);

  return (
    <div ref={containerRef}>
      {Slider ? <Slider reviews={reviews} gbpUrl={gbpUrl} /> : null}
    </div>
  );
}
