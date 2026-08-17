'use client';

import { useEffect } from 'react';

type Ids = {
  query: string;
  noResults: string;
  resultCount?: string;
};

type Props = {
  ids: Ids;
  urlKeys: { q?: string };
  minQueryLen?: number;
};

/** Dynamically loads and mounts the FAQ archive search behavior after hydration. */
export default function FaqSearchController({ ids, urlKeys, minQueryLen = 2 }: Props) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import('./faq-search-runtime')
      .then((mod) => {
        if (cancelled) return;
        const mount = mod.mountFaqSearch;
        if (typeof mount === 'function') {
          cleanup = mount({ ids, urlKeys, minQueryLen, defer: false });
        } else {
          console.warn('[FaqSearchController] mountFaqSearch not found');
        }
      })
      .catch((error) => {
        console.error('[FaqSearchController] failed to mount search', error);
      });

    return () => {
      cancelled = true;
      try {
        cleanup?.();
      } catch {}
    };
  }, [ids, minQueryLen, urlKeys]);

  return null;
}
