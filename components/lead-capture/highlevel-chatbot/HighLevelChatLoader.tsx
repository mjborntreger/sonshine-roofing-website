'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    __highLevelChatLoaded?: boolean;
  }
}

const HIGHLEVEL_WIDGET_ID = '6976efd1572f858de7e8d5b3';
const HIGHLEVEL_SCRIPT_SRC = 'https://widgets.leadconnectorhq.com/loader.js';
const HIGHLEVEL_RESOURCES_URL = 'https://widgets.leadconnectorhq.com/chat-widget/loader.js';

export default function HighLevelChatLoader() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.__highLevelChatLoaded) return undefined;

    const injectScript = () => {
      if (window.__highLevelChatLoaded) return;
      window.__highLevelChatLoaded = true;

      try {
        const script = document.createElement('script');
        script.async = true;
        script.src = HIGHLEVEL_SCRIPT_SRC;
        script.setAttribute('data-resources-url', HIGHLEVEL_RESOURCES_URL);
        script.setAttribute('data-widget-id', HIGHLEVEL_WIDGET_ID);

        document.head?.appendChild(script);
      } catch {
        window.__highLevelChatLoaded = false;
      }
    };

    let idleHandle: number | undefined;
    let idleFallbackHandle: number | undefined;
    let engagementTimer: number | undefined;
    let listenersActive = false;

    const scheduleInjection = () => {
      if (window.__highLevelChatLoaded) return;
      if (idleHandle !== undefined || idleFallbackHandle !== undefined) return;

      if (typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(injectScript, { timeout: 4000 });
      } else {
        idleFallbackHandle = window.setTimeout(injectScript, 2500);
      }
    };

    const clearEngagementTimer = () => {
      if (engagementTimer !== undefined) {
        window.clearTimeout(engagementTimer);
        engagementTimer = undefined;
      }
    };

    const passiveOptions: AddEventListenerOptions = { passive: true };
    const engagementEvents: Array<{ event: keyof WindowEventMap; options?: AddEventListenerOptions }> = [
      { event: 'scroll', options: passiveOptions },
      { event: 'pointerdown', options: passiveOptions },
      { event: 'keydown' },
      { event: 'touchstart', options: passiveOptions },
    ];

    const cleanupListeners = () => {
      if (!listenersActive) return;
      listenersActive = false;
      engagementEvents.forEach(({ event, options }) => {
        window.removeEventListener(event, handleFirstEngagement, options);
      });
      clearEngagementTimer();
    };

    function handleFirstEngagement() {
      if (window.__highLevelChatLoaded) {
        cleanupListeners();
        return;
      }
      cleanupListeners();
      scheduleInjection();
    }

    engagementEvents.forEach(({ event, options }) => {
      window.addEventListener(event, handleFirstEngagement, options);
    });
    listenersActive = true;

    engagementTimer = window.setTimeout(handleFirstEngagement, 6000);

    return () => {
      cleanupListeners();
      if (idleHandle !== undefined) {
        window.cancelIdleCallback?.(idleHandle);
      }
      if (idleFallbackHandle !== undefined) {
        window.clearTimeout(idleFallbackHandle);
      }
    };
  }, []);

  return null;
}
