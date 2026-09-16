# Location migration execution — September 16, 2026

The CMS content and local code changes below are applied. Website deployment remains held; the live website still uses the previously deployed WordPress-backed location pages.

## Completed

| Work | Result |
| --- | --- |
| Export | Rendered HTML is captured explicitly in source export v2. Missing bodies fail export; available empty bodies have a separate state. All five current WordPress bodies were recovered in a fresh private capture. Old exports are unchanged. This is not a historical RAW-content backup. |
| CI and routes | Quality runs all nine location verifiers plus export tests and 14 dynamic-route contract groups. The six parameterized page families, sitemaps and resource API are covered. Route-owner inventory and special-offer enumeration exhaust pagination. |
| Overviews | Five fields populated with reviewed local copy, public project examples and source checks. Other page fields remain unchanged. |
| Neighborhood descriptions | First pass imported all 87 canonical descriptions from 88 WordPress occurrences. Second pass rewrote 86 against WRITING.md and source evidence. Arroyo Vista's description is held empty because the source identity/geography could not be established. |
| Project neighborhoods | All 53 exact project/job identities verified privately. Twelve assignments to existing published neighborhoods applied. All primary service areas and job mappings preserved. |
| FAQs | 25 new published local FAQs, five per published hub. The previous 45 FAQs are unchanged. Each hub displays five local FAQs before eight shared FAQs. Mobile DOM order follows the same sequence. The FAQ archive exposes all 70 answers in matching structured data. |

Neighborhood rewrites correct the DeSoto Acres/DeSoto Lakes mismatch, separate Lakeside Plantation in North Port from Plantation in Venice, remove unsupported performance claims, and correct Lido Key's position. The migration planner now preserves later descriptions unless an explicit reviewed revision is supplied.

## Decisions and factual holds

- **25 proposed neighborhood additions cover 28 projects.** No new records have been created. The owner was asked whether to create them; see the [names, service areas and all 53 project dispositions](location-project-neighborhoods.md).
- **11 projects remain empty with documented exceptions**, as the owner instructed. Numbered subdivision plats alone do not establish a named neighborhood. Section 15 is a proposed exception because Charlotte County separately identifies it as a civic area.
- **Two memberships remain unresolved:** High Oaks Trail/Saddlebag Creek Ranches and East Corktree Circle/Oak Hollow. Candidate community evidence exists, but exact membership is not established. These are evidence gaps, not confirmed absence of a neighborhood.
- **Arroyo Vista needs identification.** The old description combined three names and unverified Sarasota geography. Its description is empty; the previously approved name, publication, photo and service-area grouping remain unchanged. A community link or nearby cross streets can resolve the hold.

## Verification

Directus writes have narrow before/after receipts and exact readback. Fresh comparisons report zero pending repeat changes for the applied content and existing-neighborhood assignments. The coordinator independently compared all five overview records and all 70 FAQs with the execution receipt. The prior 45 FAQs, including modification timestamps, remain unchanged.

All 24 npm checks in the updated Quality workflow passed under Node 22.23.2.
The credentialed build generated **456 pages** and validated **443 published route owners**. A second build enabled the existing sitemap preview flag to exercise XML output locally. Built-page checks confirmed:

- Five location routes return 200 with the correct canonical URL, 13 FAQs in the expected order and matching FAQPage schema.
- The FAQ archive has 70 displayed answers and 70 schema entries.
- The location sitemap includes all five published routes; taxonomy-only and unknown location routes return 404.
- All 12 assigned neighborhoods appear in the generated project snapshot; the other 41 remain null, and all 12 assigned project pages were generated.
- Existing singular location URLs redirect with 308. A trailing slash first passes through Next.js slash normalization, giving two redirects instead of one.
- At a measured 389 × 845 CSS-pixel viewport, all five hubs have no horizontal overflow and a single column of 13 FAQs. The hydrated expand/collapse control toggles all 13 answers.

Desktop screenshots were inspected. Resized browser screenshots returned blank images despite a working DOM, so final mobile visual inspection remains part of release acceptance. No lead forms were submitted.

Two independent review agents reviewed the completed work in sequence, with no
implementation role. The second formed its assessment without reading the first
report. Both found **no new actionable defects**. Their independent live CMS
comparisons, focused regression runs, source/receipt checks and recovery hash
checks passed. No code or CMS correction was required from their findings.

Both reviews retain the known holds above. Their limits include sampled public
source checks, reliance on narrow saved exact-job/county evidence rather than
repeating every external lookup, and incomplete mobile screenshot acceptance.
Review reports are preserved privately with the verification artifacts.

## Recovery

Private evidence is preserved under the approved recovery root:
`/Users/home/Documents/SonShine-Migration-Recovery/2026-09-15/execution-2026-09-16/`.
Directories use 0700 and files 0600. A 28-file manifest verifies source and destination SHA-256 hashes. It includes the rendered source, both description passes, overview/FAQ proposals and receipts, and narrow private project-address evidence. No private address or job mapping is committed to this repository.

Applied overview/FAQ proposal SHA-256:
`b5f2fc36fc26e208e276617732e180133bb8e5fe4fcea04e19b8809a98d33c3f`.

Applied second-pass description proposal SHA-256:
`4f7940e16ab39d106366a5f6d06d17810ebd5abfa04064284103a0eea9ac5043`.

Before restoring any field, compare its live value with the saved after-image to avoid replacing a later edit. Website deployment, WordPress changes and n8n changes are outside this execution.
