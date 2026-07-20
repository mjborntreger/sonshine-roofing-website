'use client';

import { useEffect, useState } from 'react';
import QuickQuoteWebFormSkeleton from './QuickQuoteWebFormSkeleton';
import {
  getLeadAttributionForSubmit,
  type AttributionQueryField,
} from '@/lib/lead-capture/attribution';
import { pushToDataLayer } from '@/lib/telemetry/gtm';
import SitePhoneLink from '@/components/utils/SitePhoneLink';

const QUICKQUOTE_TARGET_ID = 'quickquote-web-form';
const QUICKQUOTE_CONTRACTOR_ID = 'd9d4c0ba-e0cc-4f1c-a12e-5c30d9b2ce8d';
const QUICKQUOTE_API_BASE = 'https://quickquote-api-628343900656.us-central1.run.app';
const QUICKQUOTE_LOADER_SRC = `https://qq.leadsbyquickquote.com/roofs/integration?target=${QUICKQUOTE_TARGET_ID}&contractorId=${QUICKQUOTE_CONTRACTOR_ID}`;

const ATTRIBUTION_FIELDS: AttributionQueryField[] = [
  'utm_campaign',
  'utm_source',
  'utm_medium',
  'utm_content',
  'utm_term',
  'gclid',
];

const BRIDGED_IDS_KEY = 'ss_quickquote_bridged_ids_v1';
const CONVERTED_IDS_KEY = 'ss_quickquote_converted_ids_v1';
const FALLBACK_LEAD_ID_KEY = 'ss_quickquote_fallback_lead_id';

type DataLayerEvent = Record<string, unknown>;
type QuickQuoteLoadStatus = 'loading' | 'ready' | 'error';
type QuickQuoteRenderResult = unknown | PromiseLike<unknown>;

type QuickQuoteGlobal = {
  render?: (config: Record<string, unknown>) => QuickQuoteRenderResult;
  queue?: Record<string, unknown>[];
};

type QuickQuoteWindow = Window & {
  dataLayer?: DataLayerEvent[];
  QuickQuote?: QuickQuoteGlobal;
  __ssQuickQuoteDataLayerBridgeInstalled?: boolean;
};

const memorySeen = new Map<string, Set<string>>();

function cleanString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function isRecord(value: unknown): value is DataLayerEvent {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readIds(key: string): Set<string> {
  if (typeof window === 'undefined') return memorySeen.get(key) ?? new Set();

  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    const ids = Array.isArray(parsed?.ids) ? parsed.ids : [];
    return new Set(
      ids.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0),
    );
  } catch {
    return memorySeen.get(key) ?? new Set();
  }
}

function writeIds(key: string, ids: Set<string>) {
  memorySeen.set(key, ids);

  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ ids: Array.from(ids).slice(-100) }));
  } catch {
    // Session storage may be unavailable in privacy-restricted contexts.
  }
}

function markOnce(key: string, id: string): boolean {
  const ids = readIds(key);
  if (ids.has(id)) return false;
  ids.add(id);
  writeIds(key, ids);
  return true;
}

function getFallbackLeadId(): string {
  if (typeof window === 'undefined') return 'quickquote-fallback';

  try {
    const existing = window.sessionStorage.getItem(FALLBACK_LEAD_ID_KEY);
    if (existing) return existing;
    const generated =
      typeof window.crypto?.randomUUID === 'function'
        ? `quickquote-${window.crypto.randomUUID()}`
        : `quickquote-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(FALLBACK_LEAD_ID_KEY, generated);
    return generated;
  } catch {
    return `quickquote-${Date.now()}`;
  }
}

function getQuickQuoteLeadId(event: DataLayerEvent): string {
  return cleanString(event.lead_id) ?? getFallbackLeadId();
}

function buildQuickQuoteRenderConfig() {
  return {
    vertical: 'roofs',
    mode: 'inline',
    target: `#${QUICKQUOTE_TARGET_ID}`,
    contractorID: QUICKQUOTE_CONTRACTOR_ID,
    contractorId: QUICKQUOTE_CONTRACTOR_ID,
    apiBase: QUICKQUOTE_API_BASE,
    verticalOptions: {
      apiBase: QUICKQUOTE_API_BASE,
    },
    options: {
      apiBase: QUICKQUOTE_API_BASE,
    },
  };
}

function targetHasQuickQuoteContent(target: HTMLElement | null): boolean {
  if (!target) return false;
  if (target.querySelector('[data-qq-fallback]')) return true;

  const shadowRoot = target.shadowRoot;
  if (!shadowRoot) return false;

  if (shadowRoot.querySelector('#dynamicContractorForm, #qq-config-error, .qq-inline-wrapper')) {
    return true;
  }

  const reactRoot = shadowRoot.querySelector<HTMLElement>("[data-qq-role='react-root']");
  return Boolean(reactRoot?.childElementCount);
}

function watchQuickQuoteTarget(onReady: () => void): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {};

  const target = document.getElementById(QUICKQUOTE_TARGET_ID);
  if (!target) return () => {};

  let disposed = false;
  let completed = false;
  let frame = 0;
  let intervalId: number | undefined;
  let observedShadowRoot: ShadowRoot | null = null;

  const finish = () => {
    if (completed) return;
    completed = true;
    cleanup();
    onReady();
  };

  const check = () => {
    if (disposed || completed) return;

    if (target.shadowRoot && target.shadowRoot !== observedShadowRoot && observer) {
      observer.observe(target.shadowRoot, { attributes: true, childList: true, subtree: true });
      observedShadowRoot = target.shadowRoot;
    }

    if (targetHasQuickQuoteContent(target)) {
      finish();
    }
  };

  const scheduleCheck = () => {
    if (disposed || completed || frame) return;

    frame = window.requestAnimationFrame(() => {
      frame = 0;
      check();
    });
  };

  const observer =
    typeof MutationObserver !== 'undefined' ? new MutationObserver(scheduleCheck) : null;

  observer?.observe(target, { attributes: true, childList: true, subtree: true });
  intervalId = window.setInterval(scheduleCheck, 125);
  scheduleCheck();

  function cleanup() {
    disposed = true;
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
    observer?.disconnect();
  }

  return cleanup;
}

function hydrateQuickQuoteAttributionUrl() {
  const attribution = getLeadAttributionForSubmit();
  if (!attribution || typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  let changed = false;

  for (const field of ATTRIBUTION_FIELDS) {
    const value = attribution[field];
    if (!value || url.searchParams.has(field)) continue;
    url.searchParams.set(field, value);
    changed = true;
  }

  if (changed) {
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  }
}

function pushQuickQuoteConversionEvents(event: DataLayerEvent) {
  const leadId = getQuickQuoteLeadId(event);
  if (!markOnce(BRIDGED_IDS_KEY, leadId)) return;

  const mode = cleanString(event.mode) ?? 'web_form';
  const leadSource = cleanString(event.lead_source) ?? 'web_form';
  const contractorId = cleanString(event.contractor_id) ?? QUICKQUOTE_CONTRACTOR_ID;

  pushToDataLayer({
    event: 'lead_form_submitted',
    form: 'quickquote_web_form',
    form_location: '/instant-quote',
    lead_id: leadId,
    lead_type: 'roof_replacement',
    projectType: 'retail',
    event_source: 'quickquote_bridge',
    quickquote_mode: mode,
    quickquote_lead_source: leadSource,
    contractor_id: contractorId,
  });

  if (!markOnce(CONVERTED_IDS_KEY, leadId)) return;

  pushToDataLayer({
    event: 'ads_lead_submit',
    city: null,
    zip: null,
    form_location: '/instant-quote',
    conversion_value: 1500,
    currency: 'USD',
    current_roof_type: null,
    roof_age_bucket: null,
    lead_id: leadId,
    lead_type: 'roof_replacement',
  });
}

function handleDataLayerItem(item: unknown) {
  if (!isRecord(item) || item.event !== 'qq_form_submit_success') return;
  pushQuickQuoteConversionEvents(item);
}

function installQuickQuoteDataLayerBridge() {
  if (typeof window === 'undefined') return;
  const win = window as QuickQuoteWindow;

  if (!Array.isArray(win.dataLayer)) {
    win.dataLayer = [];
  }

  if (win.__ssQuickQuoteDataLayerBridgeInstalled) return;
  win.__ssQuickQuoteDataLayerBridgeInstalled = true;

  const dataLayer = win.dataLayer;
  const originalPush = dataLayer.push.bind(dataLayer);

  dataLayer.push = (...items: DataLayerEvent[]) => {
    const result = originalPush(...items);
    items.forEach(handleDataLayerItem);
    return result;
  };

  dataLayer.forEach(handleDataLayerItem);
}

function renderExistingQuickQuote(onReady: () => void, onError: () => void): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as QuickQuoteWindow;

  if (typeof win.QuickQuote?.render !== 'function') return false;
  if (!document.getElementById(QUICKQUOTE_TARGET_ID)) return false;

  try {
    const result = win.QuickQuote.render(buildQuickQuoteRenderConfig());
    Promise.resolve(result).then(
      () => {
        window.requestAnimationFrame(onReady);
      },
      () => {
        onError();
      },
    );
  } catch {
    onError();
  }

  return true;
}

function loadQuickQuoteScript(onError: () => void): () => void {
  if (typeof document === 'undefined') return () => {};

  const existing = document.querySelector<HTMLScriptElement>(
    "script[data-ss-quickquote-loader='true']",
  );
  if (existing) {
    if (existing.dataset.ssQuickquoteLoadError === 'true') {
      onError();
      return () => {};
    }

    existing.addEventListener('error', onError, { once: true });
    return () => {
      existing.removeEventListener('error', onError);
    };
  }

  const script = document.createElement('script');
  script.src = QUICKQUOTE_LOADER_SRC;
  script.async = true;
  script.dataset.ssQuickquoteLoader = 'true';

  const handleError = () => {
    script.dataset.ssQuickquoteLoadError = 'true';
    onError();
  };

  script.addEventListener('error', handleError, { once: true });
  document.head.appendChild(script);

  return () => {
    script.removeEventListener('error', handleError);
  };
}

function QuickQuoteLoadError() {
  return (
    <div
      role="alert"
      className="mx-auto w-full max-w-[480px] rounded-[16px] border border-amber-200 bg-amber-50 px-5 pb-8 text-sm text-amber-950 shadow-[0_16px_36px_rgba(15,23,42,0.12)]"
    >
      The 60-sec quote form is taking longer than expected to load. Please refresh the page or call{' '}
      <SitePhoneLink className="font-semibold underline" />.
    </div>
  );
}

export default function QuickQuoteWebForm() {
  const [loadStatus, setLoadStatus] = useState<QuickQuoteLoadStatus>('loading');
  const isLoading = loadStatus === 'loading';

  useEffect(() => {
    let active = true;
    let readyFrame = 0;

    const markReady = () => {
      if (!active) return;

      if (readyFrame) {
        window.cancelAnimationFrame(readyFrame);
      }

      readyFrame = window.requestAnimationFrame(() => {
        readyFrame = 0;
        if (active) setLoadStatus('ready');
      });
    };

    const markError = () => {
      if (active) {
        setLoadStatus((current) => (current === 'ready' ? current : 'error'));
      }
    };

    const cleanupWatcher = watchQuickQuoteTarget(markReady);
    let cleanupScript = () => {};

    hydrateQuickQuoteAttributionUrl();
    installQuickQuoteDataLayerBridge();

    if (!renderExistingQuickQuote(markReady, markError)) {
      cleanupScript = loadQuickQuoteScript(markError);
    }

    return () => {
      active = false;
      cleanupWatcher();
      cleanupScript();
      if (readyFrame) {
        window.cancelAnimationFrame(readyFrame);
      }
    };
  }, []);

  return (
    <>
      <div className="relative min-h-[720px] w-full overflow-hidden" aria-busy={isLoading}>
        {isLoading ? (
          <div className="pointer-events-none absolute inset-0 z-10 py-16">
            <QuickQuoteWebFormSkeleton />
          </div>
        ) : null}

        {loadStatus === 'error' ? (
          <div className="absolute inset-0 z-10 py-16">
            <QuickQuoteLoadError />
          </div>
        ) : null}

        <div
          id={QUICKQUOTE_TARGET_ID}
          className={[
            'min-h-[720px] w-full overflow-hidden py-16',
            isLoading || loadStatus === 'error' ? 'pointer-events-none opacity-0' : null,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-live="polite"
        />
      </div>
      <noscript>
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          JavaScript is required to load the 60-sec quote form. Please call <SitePhoneLink /> for
          help.
        </p>
      </noscript>
    </>
  );
}
