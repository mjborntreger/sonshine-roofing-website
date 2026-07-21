# Security policy

## Reporting a vulnerability

Use GitHub private vulnerability reporting when available, or email [contact@borntregerdigital.com](mailto:contact@borntregerdigital.com). Do not open a public issue.

Include the affected route or component, current commit, redacted reproduction steps, impact, and a minimal sanitized proof. Never include credentials, tokens, real lead or referral data, webhook responses, or other personal information. We will acknowledge receipt, investigate, and coordinate disclosure and remediation privately.

## Scope

In scope are lead capture and forwarding, referral data, SMS consent, attribution, Turnstile and origin validation, anti-spam controls, revalidation authorization, Directus and WordPress content scoping, CMS HTML sanitization, CSP and security headers, third-party embeds, telemetry/QuickQuote data exposure, dependencies, and the build pipeline.

Do not submit real customer data, mutate production content, test credentials, perform denial-of-service or social-engineering tests, or send automated scanner traffic to public forms or external systems. Directus, WordPress, n8n, Turnstile, analytics, QuickQuote, Coolify, hosting, and other third-party services must not be tested directly without explicit written authorization.

## Supported version

Only the current `main` branch is supported. Please verify that a report still applies to the latest commit before submitting it.
