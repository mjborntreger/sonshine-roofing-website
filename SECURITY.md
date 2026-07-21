# Security Policy

## Supported Code

Security fixes target the current `main` branch. Historical commits,
WordPress content, Directus content, and third-party services may require
separate maintainer coordination.

## Report Privately

Use GitHub private vulnerability reporting when the repository Security tab
offers it. Otherwise email [contact@borntregerdigital.com](mailto:contact@borntregerdigital.com).
Do not open a public issue for a suspected vulnerability.

Include the affected route or component, commit or version, reproduction steps,
impact, and any suggested mitigation. Remove credentials, tokens, lead or
referral payloads, customer contact details, addresses, CMS-private content,
and unnecessary personal information. Never send a working secret.

## In Scope

- Lead capture, referral data, SMS consent, attribution, and n8n forwarding.
- Turnstile, honeypot, origin validation, revalidation authorization, and
  staging-only diagnostic gates.
- Directus/WordPress tenant or content exposure and server-side token handling.
- Stored or rendered HTML sanitation, outbound URLs, XSS, CSP, and headers.
- Analytics/QuickQuote conversion-data leakage.
- Dependency, build-pipeline, Docker, or client-bundle compromise.

## Safe Testing

Use synthetic data and the minimum requests needed to demonstrate the issue.
Do not submit real leads, mutate production or CMS content, test credentials,
degrade availability, or run broad scanners against public forms. We will
coordinate validation, remediation, and disclosure privately.
