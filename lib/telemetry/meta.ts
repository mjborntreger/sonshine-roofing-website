type FbqCommand = (command: string, eventName?: string, params?: Record<string, unknown>) => void;

export type MetaStandardEvent = 'Lead' | 'Contact';

const META_EVENT_DEFAULTS: Record<MetaStandardEvent, { value: number; currency: 'USD' }> = {
  Lead: { value: 2000, currency: 'USD' },
  Contact: { value: 1000, currency: 'USD' },
};

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

  const params = { ...META_EVENT_DEFAULTS[event], ...(payload || {}) };

  try {
    fbq('track', event, params);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[meta-pixel] track failed', error);
    }
  }
}
