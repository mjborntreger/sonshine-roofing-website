import { NextRequest, NextResponse } from 'next/server';
import {
  isHoneypotTripped,
  parseLead,
  type LeadInput,
  type FinancingLeadInput,
  type FeedbackLeadInput,
  type SpecialOfferLeadInput,
  type ContactLeadInput,
} from '@/lib/lead-capture/validation';
import { formatPhoneUSForDisplay } from '@/lib/lead-capture/phone';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGIN || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveRequestOrigin(req: NextRequest): string | null {
  const origin = req.headers.get('origin');
  if (origin) return origin;
  const referer = req.headers.get('referer');
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

type TurnstileResponse = { success: boolean; 'error-codes'?: string[] };

async function verifyTurnstile(token: string, remoteip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, error: 'Server misconfigured (Turnstile secret)' } as const;

  const body = new URLSearchParams();
  body.append('secret', secret);
  body.append('response', token);
  if (remoteip) body.append('remoteip', remoteip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    cache: 'no-store',
  });

  if (!res.ok) return { ok: false, error: `Turnstile verify failed (${res.status})` } as const;

  let data: TurnstileResponse;
  try {
    data = (await res.json()) as TurnstileResponse;
  } catch {
    return { ok: false, error: 'Turnstile: invalid response' } as const;
  }

  if (!data.success) {
    return { ok: false, error: `Turnstile: ${data['error-codes']?.join(', ') || 'unknown'}` } as const;
  }
  return { ok: true } as const;
}

function getClientIp(req: NextRequest): string | null {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || null;
  const xr = req.headers.get('x-real-ip');
  if (xr) return xr.trim();
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  return null;
}

type ForwardConfig = {
  url: string;
  secret: string;
};

function resolveForwardConfig(type: LeadInput['type']): ForwardConfig | null {
  const sharedUrl = process.env.LEAD_ENDPOINT_URL;
  const sharedSecret = process.env.LEAD_FORWARD_SECRET;
  if (sharedUrl && sharedSecret) {
    return { url: sharedUrl, secret: sharedSecret };
  }

  const typeSpecific: Partial<Record<LeadInput['type'], ForwardConfig | null>> = {
    'financing-calculator':
      process.env.FINANCING_LEAD_ENDPOINT_URL && process.env.FINANCING_LEAD_FORWARD_SECRET
        ? { url: process.env.FINANCING_LEAD_ENDPOINT_URL, secret: process.env.FINANCING_LEAD_FORWARD_SECRET }
        : null,
    feedback:
      process.env.FEEDBACK_ENDPOINT_URL && process.env.FEEDBACK_FORWARD_SECRET
        ? { url: process.env.FEEDBACK_ENDPOINT_URL, secret: process.env.FEEDBACK_FORWARD_SECRET }
        : null,
    'special-offer':
      process.env.SPECIAL_OFFER_ENDPOINT_URL && process.env.SPECIAL_OFFER_FORWARD_SECRET
        ? { url: process.env.SPECIAL_OFFER_ENDPOINT_URL, secret: process.env.SPECIAL_OFFER_FORWARD_SECRET }
        : process.env.FEEDBACK_ENDPOINT_URL && process.env.FEEDBACK_FORWARD_SECRET
          ? { url: process.env.FEEDBACK_ENDPOINT_URL, secret: process.env.FEEDBACK_FORWARD_SECRET }
          : null,
    'contact-lead': null,
  };

  const resolved = typeSpecific[type] ?? null;
  if (!resolved && process.env.NODE_ENV !== 'production') {
    console.warn(`Lead forward config missing for type "${type}". Check environment variables.`);
  }
  return resolved;
}

function attachTracking(target: Record<string, unknown>, lead: LeadInput) {
  if (lead.page) target.page = lead.page;
  if (lead.utm_source) target.utm_source = lead.utm_source;
  if (lead.utm_medium) target.utm_medium = lead.utm_medium;
  if (lead.utm_campaign) target.utm_campaign = lead.utm_campaign;
}

function buildFinancingPayload(data: FinancingLeadInput) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const formattedAmount = Math.round(data.amount).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  const phoneDisplay = formatPhoneUSForDisplay(data.phone);

  const quizSummary = Array.isArray(data.quizSummary)
    ? data.quizSummary.map((item) => ({
        id: item.id,
        question: item.question,
        answerLabel: item.answerLabel,
        answerValue: item.answerValue,
        answer: item.answer,
      }))
    : [];

  const matchLabelMap: Record<string, string> = {
    serviceFinance: 'Service Finance',
    ygrene: 'YGrene PACE',
  };

  const messageLines = [
    `Financing calculator unlock request from ${fullName} for ${data.address1}, ${data.city}, ${data.state} ${data.zip}. Estimated project total: ${formattedAmount}.`,
  ];

  const payload: Record<string, unknown> = {
    type: 'financing-calculator',
    name: fullName,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    phoneDisplay,
    address1: data.address1,
    address2: data.address2 || '',
    city: data.city,
    state: data.state,
    zip: data.zip,
    amount: data.amount,
    page: data.page || '/financing',
    message: messageLines.join('\n'),
    quizSummary,
  };

  attachTracking(payload, data);

  if (data.scores) {
    payload.scores = data.scores;
  } else if (data.match) {
    payload.match = {
      program: data.match.program,
      label: matchLabelMap[data.match.program] || data.match.program,
      score: data.match.score,
      reasons: data.match.reasons,
    };
  }

  return payload;
}

function buildFeedbackPayload(data: FeedbackLeadInput) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const phoneDisplay = formatPhoneUSForDisplay(data.phone);

  const payload: Record<string, unknown> = {
    type: 'feedback',
    name: fullName,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    phoneDisplay,
    rating: String(data.rating),
    message: data.message,
    page: data.page || '/tell-us-why',
    ua: data.ua || '',
    tz: data.tz || '',
  };

  attachTracking(payload, data);

  return payload;
}

function buildSpecialOfferPayload(data: SpecialOfferLeadInput) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const phoneDisplay = formatPhoneUSForDisplay(data.phone);

  const messageLines = [
    `Special offer claim from ${fullName}.`,
    `Offer code: ${data.offerCode}`,
    `Offer slug: ${data.offerSlug}`,
  ];

  if (data.offerTitle) {
    messageLines.push(`Offer title: ${data.offerTitle}`);
  }

  if (data.message) {
    messageLines.push('', data.message);
  }

  const payload: Record<string, unknown> = {
    type: 'special-offer',
    name: fullName,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    phoneDisplay,
    offerCode: data.offerCode,
    offerSlug: data.offerSlug,
    offerTitle: data.offerTitle,
    message: messageLines.join('\n'),
    page: data.page || `/special-offers/${data.offerSlug}`,
  };

  attachTracking(payload, data);

  return payload;
}

function buildContactPayload(data: ContactLeadInput) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const phoneDisplay = formatPhoneUSForDisplay(data.phone);

  const payload: Record<string, unknown> = {
    type: 'contact-lead',
    name: fullName,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    phoneDisplay,
    projectType: data.projectType,
    helpTopics: data.helpTopics || '',
    timeline: data.timeline || '',
    notes: data.notes || '',
    preferredContact: data.preferredContact,
    bestTime: data.bestTime || '',
    consentSms: Boolean(data.consentSms),
    address1: data.address1,
    address2: data.address2 || '',
    city: data.city,
    state: data.state,
    zip: data.zip,
    page: data.page || '/contact-us',
    resourceLinks: (data.resourceLinks || []).map((link) => ({
      label: link.label,
      description: link.description || '',
      href: link.href,
      external: Boolean(link.external),
    })),
  };

  attachTracking(payload, data);

  return payload;
}

async function forwardToWP(type: LeadInput['type'], payload: Record<string, unknown>) {
  const resolved = resolveForwardConfig(type);
  if (!resolved) {
    console.error('forwardToWP: missing forward configuration', { type });
    return { ok: false, status: 500, error: 'Server misconfigured (lead endpoint)' } as const;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(resolved.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ss-secret': resolved.secret,
        origin: process.env.NEXT_PUBLIC_SITE_URL || 'https://sonshineroofing.com',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    const dataRecord = isRecord(data) ? data : {};
    const upstreamOk = dataRecord.ok === true;
    const errorMessage = typeof dataRecord.error === 'string' ? dataRecord.error : 'Upstream send failed';

    if (!res.ok || !upstreamOk) {
      console.error('forwardToWP: upstream rejected lead', {
        type,
        status: res.status,
        upstreamOk,
        error: errorMessage,
      });
      return { ok: false, status: res.status || 502, error: errorMessage } as const;
    }
    return { ok: true } as const;
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('forwardToWP: upstream timeout', { type });
      return { ok: false, status: 504, error: 'Upstream timeout' } as const;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('Lead forward error', err);
    }
    console.error('forwardToWP: upstream error', {
      type,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, status: 502, error: 'Upstream error' } as const;
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = resolveRequestOrigin(req);
  const allow = getAllowedOrigins();
  const allowOrigin = origin && allow.includes(origin) ? origin : allow[0] || '*';

  return new NextResponse(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': allowOrigin,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '600',
    },
  });
}

export async function POST(req: NextRequest) {
  const allow = getAllowedOrigins();
  if (allow.length) {
    const origin = resolveRequestOrigin(req);
    if (origin && !allow.includes(origin)) {
      return json(403, { ok: false, error: 'Forbidden origin' });
    }
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' });
  }

  if (isRecord(raw) && isHoneypotTripped(raw)) {
    return json(200, { ok: true });
  }

  const parsed = parseLead(raw);
  if (!parsed.ok) {
    return json(parsed.status, { ok: false, error: parsed.message, fieldErrors: parsed.fieldErrors });
  }
  const { data } = parsed;

  const verify = await verifyTurnstile(data.cfToken, getClientIp(req));
  if (!verify.ok) {
    return json(400, { ok: false, error: verify.error || 'Turnstile verification failed' });
  }

  let wpPayload: Record<string, unknown>;
  if (data.type === 'financing-calculator') {
    wpPayload = buildFinancingPayload(data);
  } else if (data.type === 'feedback') {
    wpPayload = buildFeedbackPayload(data);
  } else if (data.type === 'special-offer') {
    wpPayload = buildSpecialOfferPayload(data);
  } else {
    wpPayload = buildContactPayload(data);
  }

  const forwarded = await forwardToWP(data.type, wpPayload);
  if (!forwarded.ok) {
    return json(forwarded.status, { ok: false, error: forwarded.error });
  }

  return json(200, { ok: true });
}
