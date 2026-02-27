import { deleteCookie, readCookie, writeCookie } from '@/lib/telemetry/client-cookies';
import { pushToDataLayer } from '@/lib/telemetry/gtm';
import { trackMetaPixel, type MetaStandardEvent } from '@/lib/telemetry/meta';
import { normalizePhoneForSubmit, isUsPhoneComplete } from '@/lib/lead-capture/phone';
import type { ContactLeadInput, LeadInput } from '@/lib/lead-capture/validation';

export {
  stripToPhoneDigits as sanitizePhoneInput,
  normalizePhoneForSubmit,
  formatPhoneExample,
  isUsPhoneComplete,
} from '@/lib/lead-capture/phone';

export type {
  ContactLeadInput,
  FeedbackLeadInput,
  FinancingLeadInput,
  LeadInput,
  SpecialOfferLeadInput,
} from '@/lib/lead-capture/validation';

export const CONTACT_READY_COOKIE = 'ss_lead_contact_ready';
export const CONTACT_READY_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const LEAD_SUCCESS_COOKIE = 'ss_lead_form_success';
export const LEAD_SUCCESS_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type LeadSuccessCookiePayload = {
  projectType: string;
  helpTopics?: string[];
  helpTopicLabels?: string[];
  timeline?: string;
  timelineLabel?: string;
  notes?: string;
  roofTypeLabel?: string;
  timestamp?: string;
};

export interface SuccessMeta {
  projectType: string;
  helpTopicLabels: string[];
  timelineLabel: string | null;
  notes: string | null;
  roofTypeLabel: string | null;
}

export type ContactLeadResourceLink = NonNullable<ContactLeadInput['resourceLinks']>[number];

type StripIndexSignature<T> = {
  [K in keyof T as K extends string
    ? (string extends K ? never : number extends K ? never : K)
    : K extends number
      ? never
      : K
  ]: T[K];
};

const STATE_REGEX = /^[A-Za-z]{2}$/;
const ZIP_REGEX = /^\d{5}$/;

export const PREFERRED_CONTACT_VALUES = ['phone-call', 'email'] as const;
export type PreferredContactValue = (typeof PREFERRED_CONTACT_VALUES)[number];

export const DEFAULT_PREFERRED_CONTACT: PreferredContactValue = 'phone-call';

export function normalizePreferredContact(value?: string | null): PreferredContactValue {
  return value === 'email' ? 'email' : DEFAULT_PREFERRED_CONTACT;
}

export function normalizeState(value: string): string {
  return value.trim().slice(0, 2).toUpperCase();
}

export function isValidState(value: string): boolean {
  return STATE_REGEX.test(normalizeState(value));
}

export function normalizeZip(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5);
}

export function isValidZip(value: string): boolean {
  return ZIP_REGEX.test(normalizeZip(value));
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim().toLowerCase());
}

export type ContactIdentityDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type ContactAddressDraft = {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
};

export type ContactLeadPayloadDraft = {
  projectType?: string;
  helpSummary?: string;
  timelineLabel?: string;
  notes?: string;
  preferredContact?: PreferredContactValue;
  bestTimeLabel?: string;
  consentSms?: boolean;
  identity: ContactIdentityDraft;
  address: ContactAddressDraft;
  resourceLinks?: ContactLeadResourceLink[];
  page?: string;
};

export function validateContactIdentityDraft(draft: ContactIdentityDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.firstName.trim()) errors.firstName = 'Enter your first name.';
  if (!draft.lastName.trim()) errors.lastName = 'Enter your last name.';
  if (!validateEmail(draft.email)) errors.email = 'Enter a valid email (example@gmail.com).';
  if (!isUsPhoneComplete(draft.phone)) {
    errors.phone = 'Enter a valid 10-digit phone number';
  }
  return errors;
}

export function validateContactAddressDraft(draft: ContactAddressDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const stateValueRaw = draft.state ?? '';
  const zipValueRaw = draft.zip ?? '';
  const stateValue = normalizeState(stateValueRaw);
  const zipValue = normalizeZip(zipValueRaw);

  if (!draft.address1 || !draft.address1.trim()) errors.address1 = 'Enter your street address.';
  if (!draft.city || !draft.city.trim()) errors.city = 'Enter your city.';
  if (!stateValueRaw.trim()) {
    errors.state = 'State is required.';
  } else if (!isValidState(stateValue)) {
    errors.state = 'Use the two-letter state code.';
  }
  if (!zipValueRaw.trim()) {
    errors.zip = 'ZIP is required.';
  } else if (!isValidZip(zipValue)) {
    errors.zip = 'ZIP should be 5 digits.';
  }
  return errors;
}

type ContactLeadCorePayload = Omit<StripIndexSignature<ContactLeadInput>, 'cfToken' | 'hp_field'>;

export type { ContactLeadCorePayload };

export function buildContactLeadPayload(draft: ContactLeadPayloadDraft): ContactLeadCorePayload {
  const {
    projectType,
    helpSummary,
    timelineLabel,
    notes,
    preferredContact,
    bestTimeLabel,
    consentSms,
    identity,
    address,
    resourceLinks,
    page = '/contact-us',
  } = draft;

  const trimmedNotes = notes?.trim();
  const projectTypeValue = projectType?.trim();
  const address1Value = address.address1.trim();
  const address2Value = address.address2?.trim();
  const cityValue = address.city.trim();
  const stateValue = normalizeState(address.state ?? '');
  const zipValue = normalizeZip(address.zip ?? '');

  const payload: ContactLeadCorePayload = {
    type: 'contact-lead',
    projectType: projectTypeValue || undefined,
    helpTopics: helpSummary?.trim() || undefined,
    timeline: timelineLabel?.trim() || undefined,
    notes: trimmedNotes || undefined,
    firstName: identity.firstName.trim(),
    lastName: identity.lastName.trim(),
    email: identity.email.trim(),
    phone: normalizePhoneForSubmit(identity.phone),
    preferredContact: normalizePreferredContact(preferredContact),
    bestTime: bestTimeLabel?.trim() || undefined,
    consentSms: Boolean(consentSms),
    page,
    address1: address1Value,
    city: cityValue,
    state: stateValue,
    zip: zipValue,
  };

  if (address2Value) payload.address2 = address2Value;

  if (resourceLinks && resourceLinks.length) {
    payload.resourceLinks = resourceLinks.map((link) => ({
      label: link.label.trim(),
      description: link.description?.trim() || undefined,
      href: link.href,
      external: link.external,
    })) as ContactLeadResourceLink[];
  }

  return payload;
}

export function persistLeadSuccessCookie(payload: LeadSuccessCookiePayload) {
  try {
    writeCookie(LEAD_SUCCESS_COOKIE, JSON.stringify(payload), LEAD_SUCCESS_MAX_AGE);
  } catch {
    // ignore write errors
  }
}

export function parseLeadSuccessCookie(rawCookie?: string | null): LeadSuccessCookiePayload | null {
  const source = rawCookie ?? (typeof document !== 'undefined' ? readCookie(LEAD_SUCCESS_COOKIE) : null);
  if (!source) return null;

  try {
    const decoded = decodeURIComponent(source);
    const parsed = JSON.parse(decoded) as LeadSuccessCookiePayload;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.projectType !== 'string' || !parsed.projectType.trim()) return null;

    const payload: LeadSuccessCookiePayload = {
      projectType: parsed.projectType,
    };

    if (Array.isArray(parsed.helpTopics)) {
      payload.helpTopics = parsed.helpTopics.filter((value): value is string => typeof value === 'string');
    }

    if (Array.isArray(parsed.helpTopicLabels)) {
      payload.helpTopicLabels = parsed.helpTopicLabels.filter((value): value is string => typeof value === 'string');
    }

    if (typeof parsed.timeline === 'string') {
      payload.timeline = parsed.timeline;
    }

    if (typeof parsed.timelineLabel === 'string') {
      payload.timelineLabel = parsed.timelineLabel;
    }

    if (typeof parsed.notes === 'string') {
      payload.notes = parsed.notes;
    }

    if (typeof parsed.roofTypeLabel === 'string') {
      payload.roofTypeLabel = parsed.roofTypeLabel;
    }

    if (typeof parsed.timestamp === 'string') {
      payload.timestamp = parsed.timestamp;
    }

    return payload;
  } catch {
    if (typeof document !== 'undefined') {
      deleteCookie(LEAD_SUCCESS_COOKIE);
    }
    return null;
  }
}

export type LeadApiResponse = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type SubmitLeadResult =
  | { ok: true; status: number; data: LeadApiResponse }
  | { ok: false; status?: number; error: string; fieldErrors?: Record<string, string[]> };

export type SubmitLeadOptions = {
  endpoint?: string;
  signal?: AbortSignal;
  contactReadyCookie?: boolean;
  contactReadyCookieMaxAge?: number;
  gtmEvent?: Record<string, unknown>;
  metaPixelEvents?: MetaStandardEvent | MetaStandardEvent[];
};

const DEFAULT_ENDPOINT = '/api/lead';

function fireMetaPixelEvents(events?: MetaStandardEvent | MetaStandardEvent[]) {
  if (!events) return;
  const list = Array.isArray(events) ? events : [events];

  for (const event of list) {
    trackMetaPixel(event);
  }
}

export async function submitLead<T extends LeadInput>(
  payload: T,
  options: SubmitLeadOptions = {},
): Promise<SubmitLeadResult> {
  const {
    endpoint = DEFAULT_ENDPOINT,
    signal,
    contactReadyCookie = true,
    contactReadyCookieMaxAge = CONTACT_READY_MAX_AGE,
    gtmEvent,
    metaPixelEvents,
  } = options;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    let json: LeadApiResponse = {};
    try {
      json = (await response.json()) as LeadApiResponse;
    } catch {
      json = {};
    }

    if (response.ok && json.ok) {
      if (contactReadyCookie) {
        writeCookie(CONTACT_READY_COOKIE, '1', contactReadyCookieMaxAge);
      }
      if (gtmEvent) pushToDataLayer(gtmEvent);
      fireMetaPixelEvents(metaPixelEvents);
      return { ok: true, status: response.status, data: json };
    }

    const errorMessage = json.error || `Unable to submit lead (${response.status})`;
    return {
      ok: false,
      status: response.status,
      error: errorMessage,
      fieldErrors: json.fieldErrors,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null;
    return {
      ok: false,
      error: message || 'Network error',
    };
  }
}
