# GTM DataLayer Reference

This site pushes one Google Ads lead event from `/thank-you` after a successful lead submission.

## Trigger

Create a GTM Custom Event trigger:

```text
ads_lead_submit
```

The event fires only when at least one Google click ID is present in stored first-party attribution:

- `gclid`
- `gbraid`
- `wbraid`

UTM values are stored and forwarded to n8n, but they do not determine whether the ads conversion event fires.

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
| `conversion_value` | Calculated | Lead type base value plus roof-age and roof-type adjustments. |
| `currency` | Static value | Always `USD`. |
| `current_roof_type` | `details.roofType` | Values are `shingle`, `flat`, `metal`, or `tile`; `null` when not collected. |
| `roof_age_bucket` | `details.roofAge` | Uses bucket values like `10-15-years`; `null` when not collected. |
| `lead_id` | `sri_lead_id` | Use as the Google Ads transaction/order ID for dedupe. |
| `lead_type` | `details.projectType` mapping | `roof_replacement`, `roof_repair`, or `other`. |

## Lead Type Mapping

| `details.projectType` | `lead_type` | Base value |
| --- | --- | ---: |
| `retail` | `roof_replacement` | `1500` |
| `repair` | `roof_repair` | `300` |
| Anything else | `other` | `60` |

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

Formula:

```text
conversion_value = lead_type base value + roof_age_bucket adjustment + current_roof_type adjustment
```

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

Other ad-attributed lead:

```json
{
  "event": "ads_lead_submit",
  "city": null,
  "zip": null,
  "form_location": "/financing",
  "conversion_value": 60,
  "currency": "USD",
  "current_roof_type": null,
  "roof_age_bucket": null,
  "lead_id": "sri_example_other",
  "lead_type": "other"
}
```

## Dedupe

Use `lead_id` as the Google Ads transaction/order ID. The browser also records fired `lead_id` values in first-party storage so refreshing `/thank-you` does not push a second `ads_lead_submit` event for the same lead.
