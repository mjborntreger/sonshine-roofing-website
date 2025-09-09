import { NextRequest, NextResponse } from "next/server";
import { parseFeedback, isHoneypotTripped } from "@/lib/validation";

// --- utilities --------------------------------------------------------------
function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGIN || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveRequestOrigin(req: NextRequest): string | null {
  const h = req.headers;
  const origin = h.get("origin");
  if (origin) return origin;
  const referer = h.get("referer");
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
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

// Cloudflare Turnstile verification
async function verifyTurnstile(token: string, remoteip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, error: "Server misconfigured (Turnstile secret)" } as const;

  const body = new URLSearchParams();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteip) body.append("remoteip", remoteip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    cache: "no-store",
  });

  if (!res.ok) return { ok: false, error: `Turnstile verify failed (${res.status})` } as const;
  const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
  if (!data.success) return { ok: false, error: `Turnstile: ${data["error-codes"]?.join(", ") || "unknown"}` } as const;
  return { ok: true } as const;
}

function getClientIp(req: NextRequest): string | null {
  // Derive client IP from standard proxy headers
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return null;
}

// Forward to WordPress endpoint
async function forwardToWP(payload: Record<string, unknown>) {
  const url = process.env.FEEDBACK_ENDPOINT_URL;
  const secret = process.env.FEEDBACK_FORWARD_SECRET;
  if (!url || !secret) return { ok: false, status: 500, error: "Server misconfigured (WP endpoint)" } as const;

  // Abort if WP is slow
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 7000);

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ss-secret": secret,
        // forward an origin to satisfy strict CORS on WP, though server-to-server usually ignores it
        origin: process.env.NEXT_PUBLIC_SITE_URL || "https://sonshineroofing.com",
      },
      body: JSON.stringify(payload),
      signal: ctl.signal,
      cache: "no-store",
    });
    clearTimeout(t);

    const data = await r.json().catch(() => ({} as any));
    if (!r.ok || !data?.ok) {
      return { ok: false, status: r.status || 502, error: data?.error || "Upstream send failed" } as const;
    }
    return { ok: true } as const;
  } catch (err: any) {
    clearTimeout(t);
    if (err?.name === "AbortError") return { ok: false, status: 504, error: "Upstream timeout" } as const;
    if (process.env.NODE_ENV !== "production") console.error("WP forward error", err);
    return { ok: false, status: 502, error: "Upstream error" } as const;
  }
}

// CORS preflight (only needed if you plan to call from other origins)
export async function OPTIONS(req: NextRequest) {
  const origin = resolveRequestOrigin(req);
  const allow = getAllowedOrigins();
  const allowOrigin = origin && allow.includes(origin) ? origin : allow[0] || "*";

  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": allowOrigin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "600",
    },
  });
}

export async function POST(req: NextRequest) {
  // Origin check (defense-in-depth; same-origin in practice)
  const allow = getAllowedOrigins();
  if (allow.length) {
    const origin = resolveRequestOrigin(req);
    if (origin && !allow.includes(origin)) {
      return json(403, { ok: false, error: "Forbidden origin" });
    }
  }

  // Parse body JSON safely
  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  // Honeypot (accept silently to waste bot time, but return ok)
  if (raw && isHoneypotTripped(raw)) {
    return json(200, { ok: true });
  }

  // Validate
  const parsed = parseFeedback(raw);
  if (!parsed.ok) {
    return json(parsed.status, { ok: false, error: parsed.message, fieldErrors: parsed.fieldErrors });
  }
  const { data } = parsed;

  // Verify Turnstile
  const ip = getClientIp(req);
  const verify = await verifyTurnstile(data.cfToken, ip);
  if (!verify.ok) {
    return json(400, { ok: false, error: verify.error || "Turnstile verification failed" });
  }

  // Build payload for WP (do not forward cfToken or honeypot)
  const wpPayload = {
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    rating: String(data.rating),
    message: data.message,
    page: data.page || "/tell-us-why",
    ua: data.ua || "",
    tz: data.tz || "",
  };

  const forwarded = await forwardToWP(wpPayload);
  if (!forwarded.ok) {
    return json(forwarded.status, { ok: false, error: forwarded.error });
  }

  return json(200, { ok: true });
}
