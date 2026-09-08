# SonShine Roofing project upload procedure

Version 2 — September 8, 2026. This procedure applies to the frontend that uses project descriptions for narrative copy and title-and-description search. Deploy and verify that frontend before deleting the retired Directus field; see the release sequence in `CONTENT.md`.

Every post should let a homeowner understand what work SonShine completed, where it happened, which roof system was installed, and what was distinctive about the job. Write every field from one verified set of facts.

**1. Prepare the job facts before opening a new post**

Have the project team verify the following from its authorized job records. AccuLynx owns the operational job facts; a previous website post is not sufficient evidence for a new job.

| Information | Requirement |
| --- | --- |
| Public location | City/service area and an approved street or neighborhood label. Omit the house number from the normal title and description. |
| Job type | Replacement, new construction, repair, or another accurately described scope. |
| Property type | Residential or commercial, where relevant to understanding the job. |
| Completion | Verified completion month/year for the checklist. This is separate from the website publication date. |
| Main roof system | Material, manufacturer, exact product line/profile, and official color or finish when verified. Include metal gauge or membrane thickness only when documented. |
| Other work | Secondary roof areas, ventilation, underlayment, flashing, skylights, gutters, repairs, and trade-partner work actually performed. |
| Distinctive facts | One or two documented reasons, conditions, constraints, or installation details that make this project worth showing. |
| Media | Approved project photos and, when available, a video that shows this same job. Identify before, during, and finished views. |
| Review | Optional exact quotation with approved attribution, original review date, platform, and source link. |
| Verification | A private checklist recording who confirmed the facts, unresolved questions, and publication permission. Keep private job/contact details out of public fields. |

Do not guess the product, color, homeowner motivation, storm damage, installation details, savings, or warranty from photos or from a similar project. Resolve essential conflicts before publication. Omit optional details that cannot be verified.

**2. Create the Directus draft and fill the core fields**

| Directus field | Standard |
| --- | --- |
| `client` | SonShine Roofing. |
| `status` | Start with draft; publish after review and release coordination. |
| `title` | `[Street or approved label], [City], FL`. For a repeated street use `[Street] (#2), [City], FL` consistently. Example: `Example Lane (#2), Sarasota, FL`. |
| `slug` | A unique, readable, lowercase URL identifier. Check for an existing project before creating another. Preserve a published slug when editing content. |
| `published_at` | The intended editorial publication timestamp. Do not substitute upload/import time or imply that it is the job completion date. Do not rely on a future timestamp alone to schedule publication. |
| `material_type` | Select the main installed material from the existing published list. Describe a secondary material separately. |
| `service_area` | Select the actual project location from the existing published list. |
| `roof_color` | Select the verified official color where applicable. Leave it empty when genuinely unknown or inapplicable; explain a verified unpainted finish in the copy. Do not invent a color to satisfy the form. |
| `description` | Plain text, usually about 75–125 words. Use less if the job has fewer verified facts; do not pad it. |

Keep the project narrative in `description`. The separate project body field is retired from the frontend and import path. Project search uses the title and description, so state the verified material, product, and location naturally in that copy.

Use the existing vocabulary before requesting a new material, color, or service-area value. Check spelling, brand terminology, and near-duplicates. Changing a managed name or slug can affect existing filters and should be reviewed separately.

**3. Write a short description from the facts**

The first paragraph should name the job type, location, main manufacturer/product, and color or finish. The second should explain one or two meaningful details of this job, such as a documented roof condition, secondary roof system, specific ventilation work, or an unusual installation requirement.

Use this outline as a prompt, not as identical copy for every project:

> SonShine Roofing completed a [job type] in [city], installing [manufacturer] [product/profile] in [verified color/finish]. [Relevant documented context, if available.]
>
> The work also included [verified detail] and [verified detail, if useful]. [Explain the practical purpose or an observed result without inventing a measured outcome.]

Keep scope wording consistent: a new construction installation should not become a replacement elsewhere in the same post. Credit another company’s work accurately. Avoid blanket promises about energy savings, wind performance, storm protection, or lifespan; specific product or warranty claims need documentation applicable to the installed system.

Include extra component details in the description only when they help a homeowner understand the work. A nail SKU or ordinary consumable rarely needs a product link. Do not add a repeated sales pitch where the page already provides a call to action.

**4. Add the media and product links**

Choose a clear finished-roof photo for `featured_image`. Aim for roughly 4–8 useful gallery images as a starting point, with exceptions for the available evidence and project complexity. A larger installation gallery is appropriate when each image explains something new.

Order the gallery deliberately: finished overview, before view if available, useful work-in-progress views, then finished details or another overall angle. Use the gallery’s drag order; every entry needs a distinct explicit order. Inspect the whole gallery before publishing.

Every referenced file needs a concise `description` explaining what is actually visible. This text becomes image alternative text. Prefer concrete descriptions such as “Overhead view of a standing seam roof with two solar attic fans” when supported by the photo. Avoid keyword repetition and unverified manufacturer/color claims. Do not label an in-progress photo as finished work. Use consistent file titles and reuse an existing file if the same photo belongs in both the featured image and gallery.

For new photos, use the normal image-processing workflow and inspect the completed output. When replacing an already published image, upload a new file and update the project relation rather than overwriting the old file.

Use `product_links` in this order:

1. Main roofing product.
2. Secondary roof system or notable installed accessories.
3. Relevant trade partners, clearly labeled with their role.

Use labels such as `[Manufacturer] [Product/profile] — [Color/finish]` and `[Company] — Gutter installer`. Link to the exact manufacturer product where possible. Check that the destination matches the label, product line, and applicable market. Remove duplicate entries and unnecessary tracking parameters; retain parameters needed to select the correct product/color. A generic company homepage is not a substitute for an exact product page.

Video is optional. When used, put the project’s YouTube URL in `youtube_url` and verify the video plays, allows the intended display, and shows the same job. Do not add an unrelated video to make the field complete.

**5. Add and verify an optional review**

Fill `client_testimonial`, approved `client_testimonial_name`, original `client_testimonial_date`, `review_source`, and a specific `review_url`. Preserve the meaning and attribution; do not generate a review. If the review cannot be linked or verified, resolve that in editorial review rather than silently treating it as a fully sourced public review.

A review date can precede or follow the post's publication date. Do not change it merely to match the post. Keep homeowner contact details and unapproved identifiers out of the page.

Existing owner-approved exception: Brewster Rd retains its testimonial without a review URL. Leave that URL empty; this exception does not block publication or require further follow-up. Record any future exceptions explicitly rather than treating a missing source link as verified.

**6. Prepare search and social metadata**

| Field | Standard |
| --- | --- |
| `meta_title` | A readable service/location title that distinguishes this project, with SonShine Roofing where space permits. Use the same verified job type and location as the post. |
| `meta_description` | Write a complete, specific summary, typically 140–155 characters and no more than 160 under the current website behavior. End at a word or sentence boundary. Review the actual text; do not auto-cut the introduction. |
| `primary_focus_keyword` | Select a relevant phrase for a new indexable project, such as the verified service and location. |
| `focus_keywords` | Put that exact primary phrase first, followed by two relevant supporting phrases. Repeated city/service primaries are acceptable across distinct real projects; do not force street-name variations. |
| `og_title`, `og_description` | Leave empty to use the established fallbacks, or write a deliberate social variation. If populated, check that it agrees with the main content. |
| `og_image_override` | Use only when a different social image is helpful; the featured image is the normal fallback. |
| `noindex` | Normally false for a public portfolio project. Use true only for a deliberate indexing decision. |

Keyword sets and replacement metadata prepared as proposals stay pending until application is approved. They are editorial selections, not search-volume claims. Preserve subsequent edits when applying an approved proposal.

Do not edit migration-managed identifiers or scope fields. Legacy projects may retain intentionally empty keyword fields; that exception does not apply to newly authored indexable posts.

**7. Review, release, and verify**

Have a reviewer compare the draft with the verified job facts. The same editor may perform a separate final pass when another reviewer is unavailable.

- [ ] Correct project identity, city, job type, product/profile, and color throughout the title, description, filters, product labels, and search/social text.
- [ ] No copied details from another job, invented claims, or unapproved specific addresses/customer details.
- [ ] Main roof product represented; links are relevant, clean, and not duplicated.
- [ ] Featured image is appropriate; every gallery image belongs to the job, has a useful description, and appears in the intended order.
- [ ] Optional video plays and optional review is accurately attributed and sourced.
- [ ] Metadata contains complete wording; new indexable posts have the required keyword fields.
- [ ] Draft preview reads well on desktop and mobile; thumbnails, image crops, and paragraphs are understandable.
- [ ] Publish in Directus as part of the authorized release, then complete a successful frontend build and deployment. Saving the CMS post alone is not public release.
- [ ] Confirm the public project URL, archive listing and filters, gallery order, product links, video, review, and page metadata after deployment.

Record completion and any deliberate exceptions in the private editorial checklist. If a required fact remains unresolved, keep the post in draft.
