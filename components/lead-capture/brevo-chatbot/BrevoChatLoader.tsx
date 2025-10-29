'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    __brevoConversationsLoaded?: boolean;
    BrevoConversationsID?: string;
    BrevoConversations?: {
      (...args: unknown[]): void;
      q?: unknown[][];
    };
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  }
}

export default function BrevoChatLoader() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.__brevoConversationsLoaded) return undefined;

    const injectScript = () => {
      if (window.__brevoConversationsLoaded) return;
      window.__brevoConversationsLoaded = true;

      try {
        window.BrevoConversationsID = '68507bf3bb6bfc804b0cadfc';
        if (!window.BrevoConversations) {
          const queueingFunction = (...args: unknown[]) => {
            (queueingFunction.q = queueingFunction.q || []).push(args);
          };
          window.BrevoConversations = queueingFunction as typeof window.BrevoConversations;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';

        document.head?.appendChild(script);
      } catch {
        window.__brevoConversationsLoaded = false;
      }
    };

    let idleHandle: number | undefined;
    let idleFallbackHandle: number | undefined;
    let engagementTimer: number | undefined;
    let listenersActive = false;

    const scheduleInjection = () => {
      if (window.__brevoConversationsLoaded) return;
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
      if (window.__brevoConversationsLoaded) {
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
