# Lead Operations

This document is the operational contract for public lead delivery. Deployment
configuration and general smoke checks live in [DEPLOY.md](DEPLOY.md).

## Ingress and forwarding

- Browser forms submit JSON to `POST /api/lead`.
- When `ALLOWED_ORIGIN` is populated, the route rejects requests whose Origin or
  Referer origin is not in the comma-separated allowlist.
- The route silently accepts honeypot submissions, validates the v2 payload,
  verifies `antiSpam.cfToken` with Cloudflare Turnstile, and then forwards the
  normalized payload to n8n.
- n8n receives `Content-Type: application/json`, the shared secret in
  `x-ss-secret`, and the canonical site origin.
- Forwarding times out after seven seconds. Upstream rejection or timeout is
  returned as a failed API response; the route does not claim success first.

Required server variables:

- `N8N_WEBHOOK_URL`
- `N8N_WEBHOOK_SECRET`
- `TURNSTILE_SECRET_KEY`

`ALLOWED_ORIGIN` is optional but should contain the production apex and `www`
origins in production.

QuickQuote does not use `/api/lead`. Its vendor script submits to QuickQuote,
while the site translates the vendor success event into analytics events.

## Normalized v2 payload

The route requires:

- `version: "v2"`
- `sri_lead_id`
- `formType`: `contact-lead`, `financing-calculator`, `special-offer`,
  `feedback`, or `referral`
- `submittedAt`
- `source.page`
- `contact.firstName`, `contact.lastName`, a valid `contact.email`, and a
  complete US `contact.phone`
- `smsConsent.projectSms` and `smsConsent.marketingSms`, each `yes` or `no`
- `antiSpam.cfToken`

The route derives `lead_source` as `google_ads` when `gclid`, `gbraid`, or
`wbraid` is present; otherwise it uses `seo`. It also fixes
`smsConsent.disclosureVersion` to `sms-consent-v1`.

Optional source fields are `gclid`, `gbraid`, `wbraid`, `utm_source`,
`utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `landing_page`,
`referrer`, `ua`, and `tz`. Optional address fields are `address1`, `address2`,
`city`, `state`, and `zip`. `details` is form-specific, and
`antiSpam.hp_field` is the supported nested honeypot.

Additional validation:

- Feedback requires `details.message`.
- Referral requires a complete US phone number at
  `details.referredHomeowner.phone`.
- Referral forms submit both SMS choices as `no`; the root contact is the
  referrer and `details.referredHomeowner` is the referred homeowner.

## Safety

Lead payloads contain contact, address, attribution, consent, and IP-derived
data. Do not log payloads, copy real submissions into fixtures, or use real
customer data for testing. Production submissions, n8n executions, and workflow
changes require explicit authorization; use synthetic data when testing is
authorized.
