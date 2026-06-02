# GTM DataLayer Reference

This site pushes one Google Ads lead event from `/thank-you` after a successful eligible lead submission.

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

Google click IDs (`gclid`, `gbraid`, `wbraid`) and UTM values are stored and forwarded to n8n when present, but they do not determine whether the ads conversion event fires.

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

| DataLayer variable | Source | Notes |
| --- | --- | --- |
| `event` | Static value | Always `ads_lead_submit`. |
| `city` | `address.city` | `null` when unavailable or placeholder. |
| `zip` | `address.zip` | `null` when unavailable or placeholder. |
| `form_location` | `source.page` | The form/page location submitted from. |
| `conversion_value` | Calculated | Lead type base value plus eligible roof-age and roof-type adjustments. |
| `currency` | Static value | Always `USD`. |
| `current_roof_type` | `details.roofType` | Values are `shingle`, `flat`, `metal`, or `tile`; `null` when not collected. |
| `roof_age_bucket` | `details.roofAge` | Uses bucket values like `10-15-years`; `null` when not collected. |
| `lead_id` | `sri_lead_id` | Use as the Google Ads transaction/order ID for dedupe. |
| `lead_type` | Form type/page/project mapping | `roof_replacement`, `roof_repair`, or `other`. |

## Lead Type And Value Mapping

| Source | `lead_type` | Base value | Roof adjustments |
| --- | --- | ---: | --- |
| `details.projectType = retail` | `roof_replacement` | `1500` | Yes |
| `details.projectType = repair` | `roof_repair` | `300` | Yes |
| `source.page = /roof-inspection` | `roof_repair` | `300` | Yes |
| `formType = financing-calculator` | `roof_replacement` | `1500` | No |
| `formType = referral` | `roof_replacement` | `1500` | No |
| Other eligible contact leads | `other` | `60` | No |

## Roof-Age Adjustment

| `roof_age_bucket` | Added value |
| --- | ---: |
| `0-5-years` | `0` |
| `5-10-years` | `100` |
| `10-15-years` | `300` |
| `15-20-years` | `500` |
| `20-plus-years` | `1000` |
| Missing, `not-sure`, or unknown | `0` |

## Roof-Type Adjustment

| `current_roof_type` | Added value |
| --- | ---: |
| `shingle` | `0` |
| `flat` | `0` |
| `metal` | `500` |
| `tile` | `500` |
| Missing or unknown | `0` |

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
