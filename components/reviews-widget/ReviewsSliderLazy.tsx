'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import type { CarouselReview, ReviewsSliderProps } from './types';

type Props = { reviews: CarouselReview[]; fallbackId: string };

export default function ReviewsSliderLazy({ reviews, fallbackId }: Props) {
  const [Slider, setSlider] = useState<ComponentType<ReviewsSliderProps> | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const initialized = useRef(false);

  const revealFallback = useCallback(() => {
    const fallback = document.getElementById(fallbackId);
    if (fallback) {
      fallback.hidden = false;
      fallback.classList.remove('hidden');
      fallback.removeAttribute('data-hidden-by');
    }
  }, [fallbackId]);

  const handleReady = useCallback(() => {
    initialized.current = true;
    const fallback = document.getElementById(fallbackId);
    if (fallback) {
      // Keep the reader's current focus intact if they are using a fallback source link.
      if (fallback.contains(document.activeElement)) return;
      fallback.hidden = true;
      fallback.classList.add('hidden');
      fallback.setAttribute('data-hidden-by', 'reviews-slider');
    }
    setReady(true);
  }, [fallbackId]);

  const handleError = useCallback(() => {
    initialized.current = false;
    revealFallback();
    setReady(false);
    setFailed(true);
  }, [revealFallback]);

  useEffect(() => {
    const fallback = document.getElementById(fallbackId);
    const onFocusOut = () => {
      if (initialized.current && !failed) requestAnimationFrame(handleReady);
    };
    fallback?.addEventListener('focusout', onFocusOut);
    return () => {
      fallback?.removeEventListener('focusout', onFocusOut);
      revealFallback();
    };
  }, [fallbackId, Slider, failed, handleReady, revealFallback]);

  useEffect(() => {
    if (shouldLoad) return;
    const triggerLoad = () => setShouldLoad(true);
    const events = ['scroll', 'wheel', 'touchmove', 'keydown'] as const;
    events.forEach(event => window.addEventListener(event, triggerLoad, { passive: true }));
    if (window.scrollY > 0) triggerLoad();
    return () => events.forEach(event => window.removeEventListener(event, triggerLoad));
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || Slider || failed) return;
    let cancelled = false;
    import('./ReviewsSlider').then(mod => {
      if (!cancelled) setSlider(() => mod.default);
    }).catch(() => {
      if (!cancelled) handleError();
    });
    return () => { cancelled = true; };
  }, [shouldLoad, Slider, failed, handleError]);

  if (!Slider || failed) return null;
  return (
    <div aria-hidden={!ready || undefined} style={ready ? undefined : { position: 'absolute', width: '100%', visibility: 'hidden' }}>
      <Slider key={reviews.map(review => review.id).join('|')} reviews={reviews} onReady={handleReady} onError={handleError} />
    </div>
  );
}
