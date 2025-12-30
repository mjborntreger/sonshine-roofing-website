type FbqCommand = (command: string, eventName?: string, params?: Record<string, unknown>) => void;

export type MetaStandardEvent = 'Lead' | 'Contact';

declare global {
  interface Window {
    fbq?: FbqCommand;
  }
}

function getFbq(): FbqCommand | null {
  if (typeof window === 'undefined') return null;
  const fbq = window.fbq;
  return typeof fbq === 'function' ? fbq : null;
}

export function trackMetaPixel(event: MetaStandardEvent, payload?: Record<string, unknown>) {
  const fbq = getFbq();
  if (!fbq) return;

  try {
    if (payload) {
      fbq('track', event, payload);
    } else {
      fbq('track', event);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[meta-pixel] track failed', error);
    }
  }
}
