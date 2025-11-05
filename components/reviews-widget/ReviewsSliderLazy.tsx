'use client';

import { useCallback, useEffect, useState, type ComponentType } from 'react';
import type { Review } from './types';

type Props = {
  reviews: Review[];
  gbpUrl: string;
  fallbackId?: string;
};

type SliderComponent = ComponentType<Pick<Props, 'reviews' | 'gbpUrl'>>;

export default function ReviewsSliderLazy({ reviews, gbpUrl, fallbackId }: Props) {
  const [Slider, setSlider] = useState<SliderComponent | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  const hideFallback = useCallback(() => {
    if (!fallbackId) return;
    const fallbackEl = document.getElementById(fallbackId);
    if (fallbackEl) {
      fallbackEl.classList.add('hidden');
      fallbackEl.setAttribute('data-hidden-by', 'reviews-slider');
    }
  }, [fallbackId]);

  useEffect(() => {
    if (shouldLoad) return;
    if (typeof window === 'undefined') return;

    let triggered = false;

    const cleanup = () => {
      window.removeEventListener('scroll', handleEvent);
      window.removeEventListener('wheel', handleEvent);
      window.removeEventListener('touchmove', handleEvent);
      window.removeEventListener('keydown', handleEvent);
    };

    const triggerLoad = () => {
      if (triggered) return;
      triggered = true;
      hideFallback();
      setShouldLoad(true);
      cleanup();
    };

    const handleEvent = () => triggerLoad();

    if (window.scrollY > 0) {
      triggerLoad();
      return cleanup;
    }

    window.addEventListener('scroll', handleEvent, { passive: true });
    window.addEventListener('wheel', handleEvent, { passive: true });
    window.addEventListener('touchmove', handleEvent, { passive: true });
    window.addEventListener('keydown', handleEvent);

    return cleanup;
  }, [shouldLoad, hideFallback]);

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

  useEffect(() => {
    if (!Slider) return;
    const frame = requestAnimationFrame(hideFallback);
    return () => cancelAnimationFrame(frame);
  }, [Slider, hideFallback]);

  return Slider ? <Slider reviews={reviews} gbpUrl={gbpUrl} /> : null;
}
