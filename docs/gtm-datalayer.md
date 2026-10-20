# GTM DataLayer Reference

This site pushes `ads_lead_submit` through two browser paths. Ordinary lead
forms emit it from `/thank-you` after an eligible successful submission;
QuickQuote emits it directly from `/instant-quote` after the vendor reports
success. The value tables below describe the ordinary lead path.

## Trigger

Create a GTM Custom Event trigger:

```text
ads_lead_submit
```

The event fires for successful thank-you contexts with these form types:

- `contact-lead`
- `financing-calculator`
- `referral`

The event does not fire for `special-offer` or `feedback` submissions.

## Special-offer coupon funnel

Offer forms emit the following custom events through the existing GTM queue:

| Event | When | Parameters |
| --- | --- | --- |
| `special_offer_form_view` | Once when at least 10% of the form enters the viewport | `offer_slug` |
| `special_offer_form_start` | Once on the first input change or submission attempt | `offer_slug` |
| `special_offer_form_error` | A submission fails validation, verification, transport, or the expiration check | `offer_slug`, `error_type`, `error_fields` |
| `special_offer_claimed` | The lead API accepts a request | Existing `offer_slug`, `offer_code` |

`error_type` is `validation`, `verification`, `submission`, or `expired`.
`error_fields` contains only allowlisted field names, never values or error
messages. Views/starts reset when a different offer form mounts. A failed
request does not emit `special_offer_claimed`; an accepted request is not proof
of email delivery. The existing Meta `Lead` event remains, and coupon requests
remain excluded from `ads_lead_submit`.

Use accepted requests divided by form views for completion rate, and accepted
requests divided by starts for form completion. Segment by `offer_slug` and the
analytics platform's device/acquisition dimensions. GTM/GA4 event forwarding and
report configuration belong to the external analytics control plane; dataLayer
emission alone does not configure a GA4 report. Respect the existing analytics
enablement gates.

Google click IDs (`gclid`, `gbraid`, `wbraid`) and UTM values are stored and forwarded to n8n when present, but they do not determine whether the ads conversion event fires.

## Google Search landing pages

The landing pages reuse the organic service form and its successful-submission
flow. No additional conversion event or value formula is introduced.

| Source page / `form_location` | Form type | Project type | Ads lead type | Value |
| --- | --- | --- | --- | --- |
| `/landing/roof-replacement` | `contact-lead` | `retail` | `roof_replacement` | 1500 + existing roof adjustments |
| `/landing/roof-repair` | `contact-lead` | `repair` | `roof_repair` | 300 + existing roof adjustments |
| `/landing/financing` | `contact-lead` | `retail` | `roof_replacement` | 1500 + existing roof adjustments |

The financing landing form is a replacement estimate inquiry, not the organic
financing calculator or a credit application. The organic calculator retains
its fixed 1500 value. `source.page` identifies financing inquiries in the
existing n8n/Resend staff email, AccuLynx message and lead log.

Keep all event fields, 90-day attribution, click-ID/UTM forwarding, queue/gates
and lead-ID deduplication. `lead_form_submitted` remains unchanged. An accepted
request is not yet a qualified appointment. Do not count CTA/phone-link clicks,
validation failures, or lender button clicks as successful lead submissions.

Before ad activation, inspect the published GTM/Ads configuration for event
trigger restrictions, value/currency/transaction-ID mapping, duplicate
conversion imports and primary/secondary goals. External changes require
their own authorization.

### Read-only launch audit — October 20, 2026

Published GTM version 38 was inspected in the live container. Both the roof
replacement and roof repair conversion tags listen to `ads_lead_submit`,
filtered by the corresponding `lead_type`, without a page-path restriction.
Both use `DLV - conversion_value` for the value and `DLV - lead_id` for the
transaction ID. Replacement uses literal `USD`; repair uses `DLV - currency`.
These triggers already accept the three landing-page source paths, including
financing as `roof_replacement`.

The container has a website-call conversion tag. Its phone-link click trigger
and thank-you page-view trigger have no attached tags, so neither adds another
conversion through those triggers. The separate enhanced-conversion
user-provided-data tag does not represent another conversion action.

The active n8n workflow was separately inspected through MCP: its Resend staff
notification includes `source.page`, as do its CRM message and lead log. This
verifies the configured notification path, not delivery to a recipient's inbox.

Google Ads account-level settings remain unverified: the signed-in UI displayed
an ad-blocker error and did not switch to the intended account. Before ad
activation, confirm primary/secondary goals, counting settings, value fallback,
duplicate GA4/offline imports, meaningful-call duration, and qualified-appointment
reporting in the correct account. No external settings were changed.

Local verification covers accepted and failed mocked submissions, source paths,
campaign attribution, value calculations, and refresh/direct-visit deduplication.
Run `NODE_ENV=production node scripts/verify-landing-conversions.mjs` with Node 22
for the repeatable event/value checks. Browser tests intercepted all lead
requests; no synthetic lead reached production. Localhost previews cannot use
the production Turnstile site's hostname authorization, so live anti-spam and
real delivery still require a separately authorized staging/launch check.

## QuickQuote path

QuickQuote does not submit through `/api/lead` or redirect through
`/thank-you`. A vendor `qq_form_submit_success` event is translated into
`lead_form_submitted` and a single `ads_lead_submit` event with
`form_location: "/instant-quote"`, `lead_type: "roof_replacement"`, and
`conversion_value: 1500`. QuickQuote lead IDs are deduplicated separately in
session storage.

## Event Payload

```ts
{
  event: "ads_lead_submit",
  city: "Sarasota",
  zip: "34240",
  form_location: "/roof-replacement-sarasota-fl",
  conversion_value: 2500,
  currency: "USD",
  current_roof_type: "shingle",
  roof_age_bucket: "20-plus-years",
  lead_id: "sri_...",
  lead_type: "roof_replacement"
}
```

## Variables

| DataLayer variable  | Source                         | Notes                                                                        |
| ------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `event`             | Static value                   | Always `ads_lead_submit`.                                                    |
| `city`              | `address.city`                 | `null` when unavailable or placeholder.                                      |
| `zip`               | `address.zip`                  | `null` when unavailable or placeholder.                                      |
| `form_location`     | `source.page`                  | The form/page location submitted from.                                       |
| `conversion_value`  | Calculated                     | Lead type base value plus eligible roof-age and roof-type adjustments.       |
| `currency`          | Static value                   | Always `USD`.                                                                |
| `current_roof_type` | `details.roofType`             | Values are `shingle`, `flat`, `metal`, or `tile`; `null` when not collected. |
| `roof_age_bucket`   | `details.roofAge`              | Uses bucket values like `10-15-years`; `null` when not collected.            |
| `lead_id`           | `sri_lead_id`                  | Use as the Google Ads transaction/order ID for dedupe.                       |
| `lead_type`         | Form type/page/project mapping | `roof_replacement`, `roof_repair`, or `other`.                               |

## Lead Type And Value Mapping

| Source                            | `lead_type`        | Base value | Roof adjustments |
| --------------------------------- | ------------------ | ---------: | ---------------- |
| `details.projectType = retail`    | `roof_replacement` |     `1500` | Yes              |
| `details.projectType = repair`    | `roof_repair`      |      `300` | Yes              |
| `source.page = /roof-inspection`  | `roof_repair`      |      `300` | Yes              |
| `formType = financing-calculator` | `roof_replacement` |     `1500` | No               |
| `formType = referral`             | `roof_replacement` |     `1500` | No               |
| Other eligible contact leads      | `other`            |       `60` | No               |

## Roof-Age Adjustment

| `roof_age_bucket`               | Added value |
| ------------------------------- | ----------: |
| `0-5-years`                     |         `0` |
| `5-10-years`                    |       `100` |
| `10-15-years`                   |       `300` |
| `15-20-years`                   |       `500` |
| `20-plus-years`                 |      `1000` |
| Missing, `not-sure`, or unknown |         `0` |

## Roof-Type Adjustment

| `current_roof_type` | Added value |
| ------------------- | ----------: |
| `shingle`           |         `0` |
| `flat`              |         `0` |
| `metal`             |       `500` |
| `tile`              |       `500` |
| Missing or unknown  |         `0` |

Formula for rows with roof adjustments:

```text
conversion_value = lead_type base value + roof_age_bucket adjustment + current_roof_type adjustment
```

Rows without roof adjustments use only the base value.

## Examples

Roof replacement, 20+ years:

```json
{
  "event": "ads_lead_submit",
  "city": "Sarasota",
  "zip": "34240",
  "form_location": "/roof-replacement-sarasota-fl",
  "conversion_value": 2500,
  "currency": "USD",
  "current_roof_type": "shingle",
  "roof_age_bucket": "20-plus-years",
  "lead_id": "sri_example_replacement",
  "lead_type": "roof_replacement"
}
```

Roof repair, 10-15 years, tile:

```json
{
  "event": "ads_lead_submit",
  "city": "Bradenton",
  "zip": "34205",
  "form_location": "/roof-repair",
  "conversion_value": 1100,
  "currency": "USD",
  "current_roof_type": "tile",
  "roof_age_bucket": "10-15-years",
  "lead_id": "sri_example_repair",
  "lead_type": "roof_repair"
}
```

Roof inspection, 10-15 years, metal:

```json
{
  "event": "ads_lead_submit",
  "city": null,
  "zip": null,
  "form_location": "/roof-inspection",
  "conversion_value": 800,
  "currency": "USD",
  "current_roof_type": "metal",
  "roof_age_bucket": "10-15-years",
  "lead_id": "sri_example_inspection",
  "lead_type": "roof_repair"
}
```

Financing lead:

```json
{
  "event": "ads_lead_submit",
  "city": null,
  "zip": null,
  "form_location": "/financing",
  "conversion_value": 1500,
  "currency": "USD",
  "current_roof_type": null,
  "roof_age_bucket": null,
  "lead_id": "sri_example_financing",
  "lead_type": "roof_replacement"
}
```

## Dedupe

Use `lead_id` as the Google Ads transaction/order ID. The browser also records fired `lead_id` values in first-party storage so refreshing `/thank-you` does not push a second `ads_lead_submit` event for the same lead.
