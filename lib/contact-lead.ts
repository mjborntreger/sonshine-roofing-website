import { deleteCookie, readCookie, writeCookie } from '@/lib/client-cookies';

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
  timestamp?: string;
};

export interface SuccessMeta {
  projectType: string;
  helpTopicLabels: string[];
  timelineLabel: string | null;
}

export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 15);
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim().toLowerCase());
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
