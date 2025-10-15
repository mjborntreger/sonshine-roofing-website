'use client';

import { useEffect } from 'react';
import { markChatAutoOpened } from '@/lib/telemetry/chat-consent';

interface TawkApi {
  maximize?: () => void;
  onLoad?: () => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    __tawkLoaded?: boolean;
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

type TawkChatLoaderProps = {
  autoOpen?: boolean;
  onAutoOpenComplete?: () => void;
};

export default function TawkChatLoader({ autoOpen = false, onAutoOpenComplete }: TawkChatLoaderProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || window.__tawkLoaded) return;

    const loadTawk = () => {
      if (window.__tawkLoaded) return;
      window.__tawkLoaded = true;

      try {
        window.Tawk_API = window.Tawk_API || {};
        const tawkApi = window.Tawk_API;

        if (autoOpen) {
          tawkApi.onLoad = () => {
            try {
              tawkApi.maximize?.();
              markChatAutoOpened();
            } finally {
              delete tawkApi.onLoad;
              onAutoOpenComplete?.();
            }
          };
        } else if (tawkApi.onLoad) {
          delete tawkApi.onLoad;
        }

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
  }, [autoOpen, onAutoOpenComplete]);

  return null;
}
