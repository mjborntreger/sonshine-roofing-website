import { NextRequest, NextResponse } from 'next/server';
import { isHoneypotTripped, parseFinancingLead } from '@/lib/validation';

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
  const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
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

async function forwardToWP(payload: Record<string, unknown>) {
  const url = process.env.FINANCING_LEAD_ENDPOINT_URL;
  const secret = process.env.FINANCING_LEAD_FORWARD_SECRET;
  if (!url || !secret) return { ok: false, status: 500, error: 'Server misconfigured (WP endpoint)' } as const;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ss-secret': secret,
        origin: process.env.NEXT_PUBLIC_SITE_URL || 'https://sonshineroofing.com',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok || !data?.ok) {
      return { ok: false, status: res.status || 502, error: data?.error || 'Upstream send failed' } as const;
    }
    return { ok: true } as const;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') return { ok: false, status: 504, error: 'Upstream timeout' } as const;
    if (process.env.NODE_ENV !== 'production') console.error('Financing forward error', err);
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

  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON' });
  }

  if (raw && isHoneypotTripped(raw)) {
    return json(200, { ok: true });
  }

  const parsed = parseFinancingLead(raw);
  if (!parsed.ok) {
    return json(parsed.status, { ok: false, error: parsed.message, fieldErrors: parsed.fieldErrors });
  }
  const { data } = parsed;

  const verify = await verifyTurnstile(data.cfToken, getClientIp(req));
  if (!verify.ok) {
    return json(400, { ok: false, error: verify.error || 'Turnstile verification failed' });
  }

  const wpPayload = {
    type: 'financing-calculator',
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    address1: data.address1,
    address2: data.address2 || '',
    city: data.city,
    state: data.state,
    zip: data.zip,
    amount: data.amount,
    page: data.page || '/financing',
  };

  const forwarded = await forwardToWP(wpPayload);
  if (!forwarded.ok) {
    return json(forwarded.status, { ok: false, error: forwarded.error });
  }

  return json(200, { ok: true });
}
