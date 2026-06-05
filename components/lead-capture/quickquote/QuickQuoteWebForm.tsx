"use client";

import { useEffect } from "react";
import { getLeadAttributionForSubmit, type AttributionQueryField } from "@/lib/lead-capture/attribution";
import { pushToDataLayer } from "@/lib/telemetry/gtm";

const QUICKQUOTE_TARGET_ID = "quickquote-web-form";
const QUICKQUOTE_CONTRACTOR_ID = "d9d4c0ba-e0cc-4f1c-a12e-5c30d9b2ce8d";
const QUICKQUOTE_API_BASE = "https://quickquote-api-628343900656.us-central1.run.app";
const QUICKQUOTE_LOADER_SRC =
  `https://qq.leadsbyquickquote.com/roofs/integration?target=${QUICKQUOTE_TARGET_ID}&contractorId=${QUICKQUOTE_CONTRACTOR_ID}`;

const ATTRIBUTION_FIELDS: AttributionQueryField[] = [
  "utm_campaign",
  "utm_source",
  "utm_medium",
  "utm_content",
  "utm_term",
  "gclid",
];

const BRIDGED_IDS_KEY = "ss_quickquote_bridged_ids_v1";
const CONVERTED_IDS_KEY = "ss_quickquote_converted_ids_v1";
const FALLBACK_LEAD_ID_KEY = "ss_quickquote_fallback_lead_id";

type DataLayerEvent = Record<string, unknown>;

type QuickQuoteGlobal = {
  render?: (config: Record<string, unknown>) => unknown;
  queue?: Record<string, unknown>[];
};

type QuickQuoteWindow = Window & {
  dataLayer?: DataLayerEvent[];
  QuickQuote?: QuickQuoteGlobal;
  __ssQuickQuoteDataLayerBridgeInstalled?: boolean;
};

const memorySeen = new Map<string, Set<string>>();

function cleanString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function isRecord(value: unknown): value is DataLayerEvent {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readIds(key: string): Set<string> {
  if (typeof window === "undefined") return memorySeen.get(key) ?? new Set();

  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    const ids = Array.isArray(parsed?.ids) ? parsed.ids : [];
    return new Set(ids.filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0));
  } catch {
    return memorySeen.get(key) ?? new Set();
  }
}

function writeIds(key: string, ids: Set<string>) {
  memorySeen.set(key, ids);

  if (typeof window === "undefined") return;
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
  if (typeof window === "undefined") return "quickquote-fallback";

  try {
    const existing = window.sessionStorage.getItem(FALLBACK_LEAD_ID_KEY);
    if (existing) return existing;
    const generated =
      typeof window.crypto?.randomUUID === "function"
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
    vertical: "roofs",
    mode: "inline",
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

function hydrateQuickQuoteAttributionUrl() {
  const attribution = getLeadAttributionForSubmit();
  if (!attribution || typeof window === "undefined") return;

  const url = new URL(window.location.href);
  let changed = false;

  for (const field of ATTRIBUTION_FIELDS) {
    const value = attribution[field];
    if (!value || url.searchParams.has(field)) continue;
    url.searchParams.set(field, value);
    changed = true;
  }

  if (changed) {
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }
}

function pushQuickQuoteConversionEvents(event: DataLayerEvent) {
  const leadId = getQuickQuoteLeadId(event);
  if (!markOnce(BRIDGED_IDS_KEY, leadId)) return;

  const mode = cleanString(event.mode) ?? "web_form";
  const leadSource = cleanString(event.lead_source) ?? "web_form";
  const contractorId = cleanString(event.contractor_id) ?? QUICKQUOTE_CONTRACTOR_ID;

  pushToDataLayer({
    event: "lead_form_submitted",
    form: "quickquote_web_form",
    form_location: "/instant-quote",
    lead_id: leadId,
    lead_type: "roof_replacement",
    projectType: "retail",
    event_source: "quickquote_bridge",
    quickquote_mode: mode,
    quickquote_lead_source: leadSource,
    contractor_id: contractorId,
  });

  if (!markOnce(CONVERTED_IDS_KEY, leadId)) return;

  pushToDataLayer({
    event: "ads_lead_submit",
    city: null,
    zip: null,
    form_location: "/instant-quote",
    conversion_value: 1500,
    currency: "USD",
    current_roof_type: null,
    roof_age_bucket: null,
    lead_id: leadId,
    lead_type: "roof_replacement",
  });
}

function handleDataLayerItem(item: unknown) {
  if (!isRecord(item) || item.event !== "qq_form_submit_success") return;
  pushQuickQuoteConversionEvents(item);
}

function installQuickQuoteDataLayerBridge() {
  if (typeof window === "undefined") return;
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

function renderExistingQuickQuote(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as QuickQuoteWindow;

  if (typeof win.QuickQuote?.render !== "function") return false;
  if (!document.getElementById(QUICKQUOTE_TARGET_ID)) return false;

  win.QuickQuote.render(buildQuickQuoteRenderConfig());
  return true;
}

function loadQuickQuoteScript() {
  if (typeof document === "undefined") return;

  const existing = document.querySelector<HTMLScriptElement>("script[data-ss-quickquote-loader='true']");
  if (existing) return;

  const script = document.createElement("script");
  script.src = QUICKQUOTE_LOADER_SRC;
  script.async = true;
  script.dataset.ssQuickquoteLoader = "true";
  document.head.appendChild(script);
}

export default function QuickQuoteWebForm() {
  useEffect(() => {
    hydrateQuickQuoteAttributionUrl();
    installQuickQuoteDataLayerBridge();

    if (!renderExistingQuickQuote()) {
      loadQuickQuoteScript();
    }
  }, []);

  return (
    <>
      <div
        id={QUICKQUOTE_TARGET_ID}
        className="min-h-[720px] w-full overflow-hidden rounded-md bg-white"
        aria-live="polite"
      />
      <noscript>
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          JavaScript is required to load the instant quote form. Please call (941) 866-4320 for help.
        </p>
      </noscript>
    </>
  );
}
