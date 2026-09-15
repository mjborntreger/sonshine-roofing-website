# Location editorial follow-up

Verified 2026-09-15 after owner approval. Application code is unchanged from
`366a45a6efae3b73188d5bbdabc88c92c21761b3`; this is a CMS content update only.

## Applied and recorded

- All 85 existing SonShine `roofing_neighborhoods` records are published.
  Updates changed only `status`; client, primary area, images and other content
  were preserved. The two held source occurrences have no imported records.
- The approved five-field SEO/date proposal was applied to all five location
  owners. Titles, descriptions, primary/focus keywords and original WordPress UTC
  publication dates match the approved proposal. Page status remains draft,
  noindex remains false and source modification dates are preserved.
- The owner approved all 72 reviews and explicitly confirmed that all have actual
  five-star ratings. Record this as owner-verified evidence, not a rating inferred
  from the old website. One missing review date remains null; two malformed source
  URLs still need verified corrections. The review import remains queued behind
  the coordinated feed/workflow/application cutover; no review records changed.
- Geographic holds and uncertain photo associations remain unchanged pending the
  owner's dispositions. No location page, workflow or website deployment occurred.

Plan hash:
`6f5c09a7d21efe5a8a6c2efc236c1a326bb199fe2936ddafb7ec6a734b71cbd5`.
Approved SEO proposal hash:
`f7276557a5841c7d9313ba1829db68ccbc8c9bcd7d17341aef929e00e3202eb1`.

The exact plan/driver received independent pre-execution review. All 90 writes
have narrow before/after receipts and exact fresh readback; final verification
matched all 90 targets. Independent review also verified all 180 before/after
receipts and fresh CMS readback, including unchanged image associations and draft
page states, with no issues found. Historical 219-operation rerun evidence predates these
editorial changes. Do not replay a migration in a way that restores draft statuses
or overwrites approved SEO. Refresh targets and preserve these owner decisions.

Private recovery root:
`/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15`.
Artifacts: `editorial-approved-01-plan.json`, `editorial-approved-01-authorization.json`,
`editorial-approved-01-apply/`, `editorial-approved-01-complete.json` and
`review-editorial-approval-02.json`. The last supersedes the earlier approval
record's unresolved-rating state. All private source identities stay outside Git.

## Geographic holds

| Key | Source placement | Issue needing disposition |
| --- | --- | --- |
| G1 | Sarasota: University Park / West of Trail area | Combined label, intended canonical neighborhood/service area and retained aerial photo are unresolved. Confirm the correct name and area, or omit. |
| G2 | Sarasota: Arroyo / Crestline / Village Park | Source combines three names; photo visibly says Arroyo Vista. Sarasota linkage is unverified. Confirm/correct the intended communities and photo, or omit. |

## Uncertain photo associations

| Key | Published neighborhood record(s) | Issue needing disposition |
| --- | --- | --- |
| P1 | Sarasota: Newtown / Washington Park | Photo shows waterfront homes, a yacht and private docks. Confirm the association, replace the photo, or remove the image link. |
| P2 | Venice: Waterford and Sawgrass | Both use the same canonical golf-course/neighborhood photo. Confirm it is valid for both, identify the correct owner, or remove/replace the incorrect association(s). |

The earlier optional-image omission proposal was not applied: the owner requested
these questions before giving dispositions. Preserve all original/imported files.
The public website continues serving the prior WordPress location pages until an
approved deployment. See [the coordinated release sequence](location-release.md).
