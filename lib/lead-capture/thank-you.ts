import type { N8nLeadPayloadV2, N8nLeadFormType } from '@/lib/lead-capture/contact-lead';
import { readCookie, writeCookie } from '@/lib/telemetry/client-cookies';
import { pushToDataLayer } from '@/lib/telemetry/gtm';
import { CLICK_ID_FIELDS } from '@/lib/lead-capture/attribution';

export const THANK_YOU_CONTEXT_KEY = 'ss_lead_thank_you_context_v1';
export const THANK_YOU_CONVERTED_KEY = 'ss_lead_converted_ids_v1';
export const THANK_YOU_CONTEXT_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

const NOT_PROVIDED_VALUES = new Set(['not provided', 'notprovided@example.com']);
const ADS_LEAD_ELIGIBLE_FORM_TYPES = new Set<N8nLeadFormType>([
  'contact-lead',
  'financing-calculator',
  'referral',
]);
const ROOF_INSPECTION_PATH = '/roof-inspection';

export type LeadType = 'roof_replacement' | 'roof_repair' | 'other';

export type ThankYouSource = {
  page: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page?: string;
  referrer?: string;
};

export type ThankYouLeadContext = {
  sri_lead_id: string;
  formType: N8nLeadFormType;
  source: ThankYouSource;
  address?: {
    city?: string;
    zip?: string;
  };
  details?: {
    projectType?: string;
    roofAge?: string;
    roofAgeLabel?: string;
    roofType?: string;
    roofTypeLabel?: string;
  };
  submittedAt: string;
};

export type AdsLeadDataLayerEvent = {
  event: 'ads_lead_submit';
  city: string | null;
  zip: string | null;
  form_location: string;
  conversion_value: number;
  currency: 'USD';
  current_roof_type: string | null;
  roof_age_bucket: string | null;
  lead_id: string;
  lead_type: LeadType;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const cleanValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (NOT_PROVIDED_VALUES.has(trimmed.toLowerCase())) return undefined;
  return trimmed;
};

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseJsonRecord(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readJsonRecord(key: string): Record<string, unknown> | null {
  const local = getStorage();
  const localRecord = local ? parseJsonRecord(local.getItem(key)) : null;
  if (localRecord) return localRecord;
  return parseJsonRecord(readCookie(key));
}

function writeJson(key: string, value: unknown, maxAge = THANK_YOU_CONTEXT_MAX_AGE) {
  const serialized = JSON.stringify(value);
  const local = getStorage();
  try {
    local?.setItem(key, serialized);
  } catch {
    // ignore storage write failures
  }
  writeCookie(key, serialized, maxAge);
}

function extractDetails(details: Record<string, unknown>): ThankYouLeadContext['details'] {
  const projectType = cleanValue(details.projectType);
  const roofAge = cleanValue(details.roofAge);
  const roofAgeLabel = cleanValue(details.roofAgeLabel);
  const roofType = cleanValue(details.roofType);
  const roofTypeLabel = cleanValue(details.roofTypeLabel);

  const next = {
    ...(projectType ? { projectType } : {}),
    ...(roofAge ? { roofAge } : {}),
    ...(roofAgeLabel ? { roofAgeLabel } : {}),
    ...(roofType ? { roofType } : {}),
    ...(roofTypeLabel ? { roofTypeLabel } : {}),
  };
  return Object.keys(next).length ? next : undefined;
}

export function buildThankYouContext(payload: N8nLeadPayloadV2): ThankYouLeadContext {
  const source: ThankYouSource = {
    page: cleanValue(payload.source.page) || '/',
    ...(cleanValue(payload.source.gclid) ? { gclid: cleanValue(payload.source.gclid) } : {}),
    ...(cleanValue(payload.source.gbraid) ? { gbraid: cleanValue(payload.source.gbraid) } : {}),
    ...(cleanValue(payload.source.wbraid) ? { wbraid: cleanValue(payload.source.wbraid) } : {}),
    ...(cleanValue(payload.source.utm_source) ? { utm_source: cleanValue(payload.source.utm_source) } : {}),
    ...(cleanValue(payload.source.utm_medium) ? { utm_medium: cleanValue(payload.source.utm_medium) } : {}),
    ...(cleanValue(payload.source.utm_campaign) ? { utm_campaign: cleanValue(payload.source.utm_campaign) } : {}),
    ...(cleanValue(payload.source.utm_term) ? { utm_term: cleanValue(payload.source.utm_term) } : {}),
    ...(cleanValue(payload.source.utm_content) ? { utm_content: cleanValue(payload.source.utm_content) } : {}),
    ...(cleanValue(payload.source.landing_page) ? { landing_page: cleanValue(payload.source.landing_page) } : {}),
    ...(cleanValue(payload.source.referrer) ? { referrer: cleanValue(payload.source.referrer) } : {}),
  };

  const city = cleanValue(payload.address?.city);
  const zip = cleanValue(payload.address?.zip);

  return {
    sri_lead_id: payload.sri_lead_id,
    formType: payload.formType,
    submittedAt: payload.submittedAt,
    source,
    ...(city || zip ? { address: { ...(city ? { city } : {}), ...(zip ? { zip } : {}) } } : {}),
    ...(payload.details ? { details: extractDetails(payload.details) } : {}),
  };
}

export function persistThankYouContext(payload: N8nLeadPayloadV2) {
  const context = buildThankYouContext(payload);
  const record = readJsonRecord(THANK_YOU_CONTEXT_KEY) ?? {};
  record[context.sri_lead_id] = context;
  writeJson(THANK_YOU_CONTEXT_KEY, record);
}

function parseThankYouLeadContext(value: unknown): ThankYouLeadContext | null {
  if (!isRecord(value)) return null;
  const sriLeadId = cleanValue(value.sri_lead_id);
  const formType = cleanValue(value.formType) as N8nLeadFormType | undefined;
  const submittedAt = cleanValue(value.submittedAt);
  const sourceRaw = isRecord(value.source) ? value.source : null;
  const page = sourceRaw ? cleanValue(sourceRaw.page) : undefined;
  if (!sriLeadId || !formType || !submittedAt || !page) return null;

  const source: ThankYouSource = { page };
  for (const field of [
    'gclid',
    'gbraid',
    'wbraid',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'landing_page',
    'referrer',
  ] as const) {
    const fieldValue = sourceRaw ? cleanValue(sourceRaw[field]) : undefined;
    if (fieldValue) source[field] = fieldValue;
  }

  const addressRaw = isRecord(value.address) ? value.address : null;
  const city = addressRaw ? cleanValue(addressRaw.city) : undefined;
  const zip = addressRaw ? cleanValue(addressRaw.zip) : undefined;

  const detailsRaw = isRecord(value.details) ? value.details : {};
  const details = extractDetails(detailsRaw);

  return {
    sri_lead_id: sriLeadId,
    formType,
    submittedAt,
    source,
    ...(city || zip ? { address: { ...(city ? { city } : {}), ...(zip ? { zip } : {}) } } : {}),
    ...(details ? { details } : {}),
  };
}

export function readThankYouContext(leadId?: string | null): ThankYouLeadContext | null {
  const id = cleanValue(leadId);
  if (!id) return null;
  const record = readJsonRecord(THANK_YOU_CONTEXT_KEY);
  if (!record) return null;
  return parseThankYouLeadContext(record[id]);
}

export function buildThankYouUrl(payload: N8nLeadPayloadV2): string {
  const params = new URLSearchParams();
  params.set('sri_lead_id', payload.sri_lead_id);
  params.set('form_type', payload.formType);

  for (const field of [
    ...CLICK_ID_FIELDS,
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'landing_page',
    'referrer',
  ] as const) {
    const value = cleanValue(payload.source[field]);
    if (value) params.set(field, value);
  }

  return `/thank-you?${params.toString()}`;
}

export function redirectToThankYou(payload: N8nLeadPayloadV2): void {
  persistThankYouContext(payload);
  if (typeof window !== 'undefined') {
    window.location.assign(buildThankYouUrl(payload));
  }
}

export function getLeadType(projectType?: string): LeadType {
  if (projectType === 'retail') return 'roof_replacement';
  if (projectType === 'repair') return 'roof_repair';
  return 'other';
}

export function getRoofAgeAdjustment(roofAge?: string): number {
  switch (roofAge) {
    case '5-10-years':
      return 100;
    case '10-15-years':
      return 300;
    case '15-20-years':
      return 500;
    case '20-plus-years':
      return 1000;
    default:
      return 0;
  }
}

export function getRoofTypeAdjustment(roofType?: string): number {
  switch (roofType) {
    case 'metal':
    case 'tile':
      return 500;
    default:
      return 0;
  }
}

export function getLeadTypeBaseValue(leadType: LeadType): number {
  switch (leadType) {
    case 'roof_replacement':
      return 1500;
    case 'roof_repair':
      return 300;
    default:
      return 60;
  }
}

function getSourcePath(page?: string): string {
  const value = cleanValue(page);
  if (!value) return '/';

  try {
    return new URL(value, 'https://sonshineroofing.local').pathname || '/';
  } catch {
    return value.split(/[?#]/)[0] || '/';
  }
}

function isAdsLeadEligible(context: ThankYouLeadContext): boolean {
  return ADS_LEAD_ELIGIBLE_FORM_TYPES.has(context.formType);
}

function resolveAdsLeadValue(context: ThankYouLeadContext): {
  leadType: LeadType;
  includeRoofAdjustments: boolean;
} {
  if (context.formType === 'financing-calculator') {
    return { leadType: 'roof_replacement', includeRoofAdjustments: false };
  }

  if (context.formType === 'referral') {
    return { leadType: 'roof_replacement', includeRoofAdjustments: false };
  }

  if (getSourcePath(context.source.page) === ROOF_INSPECTION_PATH) {
    return { leadType: 'roof_repair', includeRoofAdjustments: true };
  }

  const leadType = getLeadType(context.details?.projectType);
  return {
    leadType,
    includeRoofAdjustments: leadType === 'roof_replacement' || leadType === 'roof_repair',
  };
}

export function buildAdsLeadDataLayerEvent(context: ThankYouLeadContext): AdsLeadDataLayerEvent | null {
  if (!isAdsLeadEligible(context)) return null;

  const { leadType, includeRoofAdjustments } = resolveAdsLeadValue(context);
  const roofAge = cleanValue(context.details?.roofAge);
  const roofType = cleanValue(context.details?.roofType);
  const conversionValue =
    getLeadTypeBaseValue(leadType) +
    (includeRoofAdjustments ? getRoofAgeAdjustment(roofAge) + getRoofTypeAdjustment(roofType) : 0);

  return {
    event: 'ads_lead_submit',
    city: cleanValue(context.address?.city) ?? null,
    zip: cleanValue(context.address?.zip) ?? null,
    form_location: cleanValue(context.source.page) || '/',
    conversion_value: conversionValue,
    currency: 'USD',
    current_roof_type: roofType ?? cleanValue(context.details?.roofTypeLabel) ?? null,
    roof_age_bucket: roofAge ?? null,
    lead_id: context.sri_lead_id,
    lead_type: leadType,
  };
}

function readConvertedIds(): string[] {
  const raw = readJsonRecord(THANK_YOU_CONVERTED_KEY);
  const ids = Array.isArray(raw?.ids) ? raw.ids : [];
  return ids.filter((id): id is string => typeof id === 'string' && Boolean(cleanValue(id)));
}

function writeConvertedIds(ids: string[]) {
  writeJson(THANK_YOU_CONVERTED_KEY, { ids: ids.slice(-100) });
}

export function fireAdsLeadSubmitOnce(context: ThankYouLeadContext): AdsLeadDataLayerEvent | null {
  const event = buildAdsLeadDataLayerEvent(context);
  if (!event) return null;

  const convertedIds = readConvertedIds();
  if (convertedIds.includes(context.sri_lead_id)) return null;

  pushToDataLayer(event);
  writeConvertedIds([...convertedIds, context.sri_lead_id]);
  return event;
}
