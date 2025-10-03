import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_LEAD_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/23362284/u99lt1v/';

const trim = (value: unknown) => (typeof value === 'string' ? value.trim() : value);
const digitsOnly = (value: string) => value.replace(/\D/g, '');

const optionalTrimmedString = (max: number) =>
  z
    .preprocess((value) => {
      if (typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    }, z.string().max(max))
    .optional();

const RequestSchema = z.object({
  type: z.literal('contact-lead'),
  projectType: z.preprocess(trim, z.string().min(1).max(80)),
  helpTopics: optionalTrimmedString(400),
  timeline: optionalTrimmedString(120),
  notes: optionalTrimmedString(2000),
  firstName: z.preprocess(trim, z.string().min(1).max(120)),
  lastName: z.preprocess(trim, z.string().min(1).max(120)),
  email: z
    .preprocess(trim, z.string().min(1).max(254).email('Invalid email address')),
  phone: z
    .preprocess(trim, z.string().min(7).max(32))
    .refine((value) => {
      const digits = digitsOnly(String(value));
      return digits.length === 10 || digits.length === 11;
    }, 'Phone must include 10 digits (country code optional).'),
  address1: z.preprocess(trim, z.string().min(1).max(200)),
  address2: z.preprocess(trim, z.string().max(120)).optional(),
  city: z.preprocess(trim, z.string().min(1).max(120)),
  state: z
    .preprocess((value) => (typeof value === 'string' ? value.trim().toUpperCase() : value), z.string().min(2).max(30))
    .refine((value) => /^[A-Z]{2}$/.test(value), 'State should be a 2-letter code'),
  zip: z
    .preprocess(trim, z.string().min(3).max(15))
    .refine((value) => digitsOnly(String(value)).length === 5, 'ZIP must be 5 digits'),
  preferredContact: z.preprocess(trim, z.string().min(1).max(40)),
  bestTime: z.preprocess(trim, z.string().min(1).max(40)),
  consentSms: z.boolean().optional(),
  cfToken: z.string().min(10).max(2000),
  hp_field: z.string().optional(),
  page: z.preprocess(trim, z.string().max(2048)).optional(),
  utm_source: z.preprocess(trim, z.string().max(200)).optional(),
  utm_medium: z.preprocess(trim, z.string().max(200)).optional(),
  utm_campaign: z.preprocess(trim, z.string().max(200)).optional(),
  submittedAt: z.string().optional(),
});

function json(status: number, body: unknown) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function verifyTurnstile(token: string, remoteip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, error: 'Server misconfigured (Turnstile secret missing)' } as const;

  const formData = new URLSearchParams();
  formData.append('secret', secret);
  formData.append('response', token);
  if (remoteip) formData.append('remoteip', remoteip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: formData,
    cache: 'no-store',
  });

  if (!response.ok) return { ok: false, error: `Turnstile verify failed (${response.status})` } as const;
  const data = (await response.json()) as { success: boolean; 'error-codes'?: string[] };
  if (!data.success) {
    return { ok: false, error: `Turnstile verification failed: ${data['error-codes']?.join(', ') || 'unknown'}` } as const;
  }
  return { ok: true } as const;
}

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return null;
}

const PROJECT_LABELS: Record<string, string> = {
  'emergency-leak': 'Emergency leak help',
  replacement: 'Plan a roof replacement',
  maintenance: 'Maintenance & inspection',
  'something-else': 'Something else',
};

export async function POST(req: NextRequest) {
  if (!ZAPIER_WEBHOOK_URL) {
    return json(500, { ok: false, error: 'Server misconfigured (Zapier webhook missing)' });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON payload' });
  }

  if (rawBody && typeof rawBody === 'object' && 'hp_field' in rawBody) {
    const hp = (rawBody as Record<string, unknown>).hp_field;
    if (typeof hp === 'string' && hp.trim().length > 0) {
      return json(200, { ok: true });
    }
  }

  const parsed = RequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_';
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return json(400, { ok: false, error: 'Validation failed', fieldErrors });
  }

  const data = parsed.data;

  const verify = await verifyTurnstile(data.cfToken, getClientIp(req));
  if (!verify.ok) {
    return json(400, { ok: false, error: verify.error || 'Turnstile verification failed' });
  }

  const cleanPhone = digitsOnly(data.phone);
  const payload = {
    type: data.type,
    projectType: {
      value: data.projectType,
      label: PROJECT_LABELS[data.projectType] || data.projectType,
    },
    helpSummary: data.helpTopics || '',
    timeline: data.timeline || '',
    notes: data.notes || '',
    contact: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneDigits: cleanPhone,
      phoneFormatted:
        cleanPhone.length >= 10
          ? cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
          : cleanPhone,
      preferredContact: data.preferredContact,
      bestTime: data.bestTime,
      consentSms: Boolean(data.consentSms),
    },
    location: {
      address1: data.address1,
      address2: data.address2 || '',
      city: data.city,
      state: data.state,
      zip: data.zip,
    },
    tracking: {
      page: data.page || '/contact-us',
      utmSource: data.utm_source || '',
      utmMedium: data.utm_medium || '',
      utmCampaign: data.utm_campaign || '',
      submittedAt: data.submittedAt || new Date().toISOString(),
      ipAddress: getClientIp(req) || '',
      userAgent: req.headers.get('user-agent') || '',
      referer: req.headers.get('referer') || '',
    },
  };

  try {
    const zapierResponse = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!zapierResponse.ok) {
      const text = await zapierResponse.text().catch(() => '');
      return json(502, { ok: false, error: `Zapier webhook failed (${zapierResponse.status})`, details: text });
    }
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Zapier webhook error', error);
    }
    return json(502, { ok: false, error: 'Unable to reach automation webhook' });
  }

  return json(200, { ok: true });
}
