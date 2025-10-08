'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    __tawkLoaded?: boolean;
    Tawk_API?: Record<string, unknown>;
    Tawk_LoadStart?: Date;
  }
}

export default function TawkChatLoader() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.__tawkLoaded) return;

    const loadTawk = () => {
      if (window.__tawkLoaded) return;
      window.__tawkLoaded = true;

      try {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = new Date();

        const script = document.createElement('script');
        script.src = 'https://embed.tawk.to/5a971646d7591465c708203c/default';
        script.async = true;

        const firstScript = document.getElementsByTagName('script')[0];
        firstScript?.parentNode?.insertBefore(script, firstScript);
      } catch {
        window.__tawkLoaded = false;
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(loadTawk, { timeout: 4000 });
    } else {
      setTimeout(loadTawk, 2500);
    }
  }, []);

  return null;
}
