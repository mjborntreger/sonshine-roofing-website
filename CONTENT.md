# Content Workflow

## Where content lives

- WordPress (via WPGraphQL): location landing pages.
- The WordPress host also serves hard-coded `/wp-content/uploads` assets used by
  local routes and components. This media dependency is separate from
  WPGraphQL content ownership; audit or migrate those URLs before retiring the
  host.
- Directus, filtered by related `client.slug = DIRECTUS_CLIENT_SLUG`:
  - `blog_posts` and flat, client-scoped `blog_topics`: the exclusive blog
    source for archives, filters, post pages, recommendations, metadata, and
    blog/image sitemaps.
  - `roofing_projects` and client-scoped `roofing_material_types`,
    `roofing_roof_colors`, and `roofing_service_areas`: the exclusive project
    source for project records and project media.
  - `videos`, `video_categories`, and `video_category_assignments`: the exclusive
    video-library source, including the independently authored videos linked to projects.
  - `site_settings`: shared brand, contact, address, social, image, hero media, footer badges, company facts, robots, CSP, analytics switch, schema values, and optional raw `llms.txt` content.
  - `website_pages`: normalized SEO records for fixed routes only; canonicals are route-derived.
  - `services`: primary service route owners, including their SEO metadata.
  - `faqs`: published WYSIWYG-authored semantic HTML answers. Fixed routes use `website_page`, service routes use `service`, and a record is global only when both are null.
  - `navigation_items`: header navigation and matching footer link groups.
  - `redirects`: published legacy redirect rules loaded at build time.
  - `special_offers`: special-offer pages and popup content.
  - `legal_copy`: WYSIWYG privacy/SMS terms content.
  - `persons`: the exclusive source for the ten approved SonShine profiles. The
    adapter covers team cards, profile routes, person navigation, metadata, and
    page/image sitemaps.
  - `sponsor_features`: the exclusive source for partnership cards on the
    homepage and location landing pages.
  - `reviews` and `reviews_carousels`: the site-wide Google review feed and its
    per-client display settings.
  - `roofing_glossary_terms`: the exclusive source for the glossary archive,
    term routes, route-owned SEO, contextual term linking, and glossary sitemap.
- Next.js app pages: route layouts, components, and page body copy not yet moved to Directus.
- Homepage and About YouTube placements remain hard-coded. The entire
  `/truck-for-sale` page, including both videos, is excluded from Directus-backed
  content and CMS migration work. Its code remains the authoring source.

## Publishing shared site content in Directus

- Keep exactly one `site_settings` record for the SonShine client.
- Use unique normalized paths in `website_pages`; the 404 record is `/404` even though it has no public canonical.
- Keep the four primary `services` records published; they own their public
  routes and SEO. There are no duplicate service records in `website_pages`.
- Navigation links to service routes use `link_type=service` and the `service`
  relation. Fixed routes continue to use `link_type=page`.
- Store the complete keyword set in `focus_keywords` and include the
  `primary_focus_keyword` phrase. The adapter matches it case-insensitively and
  returns it first; a missing match fails content loading with
  `DIRECTUS_PRIMARY_FOCUS_KEYWORD_MISMATCH`.
- Route owners use the shared `seo` group: `noindex`, `meta_title`,
  `meta_description`, `primary_focus_keyword`, `focus_keywords`, `og_title`,
  `og_description`, and `og_image_override`. Keep explicit Directus values;
  frontend derivation exists only as a fallback.
- Every Directus image must have a `directus_files.description`.
- `site_settings.hero_image` and `site_settings.hero_video` are the exclusive
  hero-media sources for the homepage and location landing pages. Both files
  require a description; the image must use an image MIME type and the video
  must use a video MIME type. These fields are build-only and require a new
  site build before changes become public.
- Footer badges are image-only records in `site_settings.badges`; each image needs a description. Embedded badge HTML is not rendered.
- Populated social fields must contain absolute HTTP(S) URLs. Invalid values fail production builds.
- `site_settings.content_security_policy` is required and production builds fail when it is empty or unavailable.
- `site_settings.enable_site_analytics` is the CMS switch for GTM and Meta Pixel; the required public IDs still come from environment variables.
- `site_settings.llms_txt` is optional and is published verbatim as `/llms.txt`. Empty or whitespace-only content produces no file.
- Header, body, and footer script fields remain intentionally disabled.
- Operational hours and timezone intervals in `lib/contact-hours.ts` are a documented code-controlled exception because UI state and JSON-LD require normalized schedules.

## Publishing reviews in Directus

- The site-wide review widget reads published, SonShine-scoped Google reviews
  whose rating is five and whose `external_id` is populated. Records also need
  an author name and review text to render.
- Keep exactly one SonShine-scoped `reviews_carousels` record. Its `limit` and
  `gbp_profile_link` configure the widget.
- These collections do not replace the `featuredReviews` embedded in
  WordPress-owned location landing pages.

## Publishing FAQs in Directus

- Keep each FAQ assigned to one client and one scope: `website_page` for a fixed
  route or `service` for a service route.
- Leave both scope relations empty only for genuinely global FAQs.
- Use only paragraphs, links, bold/italic emphasis, ordered or unordered lists, list items, and line breaks in `answer` (`p`, `a`, `strong`, `em`, `ul`, `ol`, `li`, and `br`).
- Link attributes are limited to `href`, `rel`, `target`, and `title`. Destinations must begin with exactly one `/`, begin with `#`, or use `http`, `https`, `mailto`, or `tel`. Do not use protocol-relative or unsafe-protocol URLs.
- Do not add images, headings, tables, classes, IDs, inline styles, scripts, event handlers, or arbitrary editor/source markup.
- The editor toolbar guides authors, but the restricted frontend sanitizer is the authoritative security boundary. `_blank` links receive `rel="noopener noreferrer"`.
- FAQ JSON-LD uses parser-derived, entity-decoded plain text from `faqHtmlToPlainText()`; never remove tags with a regex.
- Publication uses only `status`; scope uses `website_page` or `service`.
- Page sections render global FAQs plus FAQs whose related fixed-page path or
  service slug matches the current route.
- The `/faq` archive renders General first, then fixed-page/service groups by
  their editor-facing labels.

## Publishing redirects in Directus

- Redirect changes become active only after a new site build.
- Keep `source_path` unique, set `preserve_query=true`, and use a supported status code (`301`, `302`, `303`, `307`, or `308`).
- Use `/prefix/*` for prefix wildcards. Invalid, duplicate, or self-redirect records fail the build.
- Canonical-host, global de-pagination, global `.html`, and WordPress sitemap-pattern rules remain in `next.config.mjs`.
- `proxy.ts` owns the normalized code-only legacy redirect and configured 410
  responses. Keep their exact path list in code rather than duplicating it in
  Directus.
- Deleted deprecated landing-page routes intentionally return 404; do not add redirects for them.

## Publishing in WordPress

- Publish the remaining WordPress location content before release.
- Fill excerpts where available (used as SEO fallbacks).
- Provide featured images for richer OG cards.
- Location landing pages remain a deliberate WordPress/code exception until they move to a dedicated Directus `location_landing_pages` collection.

## Publishing blog posts in Directus

- Directus is the only frontend blog source. There is no environment-controlled
  WordPress fallback.
- Set `status=published` to expose a post and provide one to three published,
  SonShine-scoped `blog_topics` relations.
- Preserve `published_at`, `source_updated_at`, `meta_title`,
  `meta_description`, and a described Directus featured image.
- Leave `author` empty for the SonShine Roofing Organization fallback; use only
  the approved SonShine-scoped Michael Borntreger person relation for his posts.
- `external_id` and `source_updated_at` are automation-owned and read-only in
  the Directus editor. `published_at`, `featured`, and ordinary editorial fields
  remain editable.

## Publishing roofing projects in Directus

- Edit projects only in `roofing_projects`. Keep the SonShine client, a unique
  stable slug, `status`, `published_at`, plain-text `description`, and a described
  `featured_image`. Published WordPress projects were the migration scope;
  unpublished WordPress records remain excluded.
- Select one published material and one published service area from the reusable
  managed lists. Roof color is optional and single-select. Preserve existing
  names/slugs because archive URLs use `mt`, `rc`, and `sa` query parameters.
- Order all gallery entries explicitly with `roofing_projects_files.sort`.
  Every gallery image appears; no default connection limit truncates the list.
  Shared featured/gallery assets can reference the same Directus file.
- Keep product links in their displayed order as `{ label, href }` entries.
  Product and review links require absolute HTTP(S) URLs. Store the project
  video relationship in the independently authored `videos` record. The old
  project `youtube_url` remains only for migration rollback and is ignored by
  the current frontend.
- The testimonial belongs to the project: `client_testimonial`,
  `client_testimonial_name`, `client_testimonial_date`, `review_source`, and
  `review_url`. It is independent of shared review synchronization and has no
  owner-reply field.
- Brewster Rd has an owner-approved exception: keep its existing testimonial
  and leave `review_url` empty. This does not block publication. New reviews
  require editorial verification and a source link unless explicitly excepted.
- Keep all project narrative in the plain-text `description`. There is no
  separate project body in the frontend or migration/import path. Shared HTML
  sanitizers remain required for other content types.
- State the job type early in the description. Project badges and service
  structured data use its first explicit "roof installation" or "roof replacement"
  phrase; copy without either phrase receives the neutral "Roofing Project" label.
- Project SEO uses the shared SEO fields and stored `noindex` policy. The
  migration preserves existing descriptions and rendered fallbacks. Legacy
  `wordpress:sonshine-roofing:` records may have empty keyword fields when the
  source supplied none; new indexable projects require a primary keyword first
  in `focus_keywords`.
- `published_at` controls public chronology. `source_updated_at` and `external_id`
  preserve migration identity; system `date_updated` starts at the source
  modified time and tracks later Directus edits. Import time is not editorial
  freshness.
- Archive search matches the title plus plain-text description, without case
  sensitivity. Results, totals, pagination, and all filter counts use that same
  matching set, including when material, color, and service-area filters combine.
- All project views use one build-generated dataset, including archive search,
  facets, pagination, homepage/location cards, video-library selections, metadata,
  and sitemaps. Save CMS changes, run a successful frontend production build,
  and deploy it to publish them. New slugs remain unavailable until deployment;
  project routes have no ISR or on-demand generation.
- Imported originals retain their bytes. Image descriptions were reviewed
  separately and belong in `directus_files.description`. Future uploads use the
  normal image-processing workflows. When replacing a published image, upload a
  new file and change the relation; overwriting an existing file would change
  media referenced by an older deployment before release and weaken rollback.
- Follow [the project authoring procedure](docs/project-authoring.md) for verified
  job facts, description copy, media, metadata review, and release checks.
- Deployment order for retiring `roofing_projects.body`: deploy and verify the
  frontend that no longer requests the field, recheck all clients for meaningful
  body values and all integrations for consumers, then remove only that field.
  Keep the field present while release approval is pending. Retain its schema
  definition privately; an older frontend rebuild needs the field restored first.

## Publishing videos in Directus

- Author every library video in `videos`, including project clips. Keep the
  SonShine client, stable `slug`, `status`, `title`, plain-text `description`,
  `youtube_url`, and website `published_at`. Video wording is independent of
  later project and YouTube edits. Existing Unicode selection slugs are valid.
- Paste one YouTube reference. The database normalizes the URL and derives
  `youtube_id`; the frontend derives watch/embed URLs and YouTube thumbnails.
  Verify playback before publishing. No custom poster, uploaded video,
  per-video SEO fields, or dedicated video pages are part of this model.
- Set the optional `project` relation on the video. Each video has at most one
  project and each project at most one video. Select the same client. Unlink a
  video deliberately before deleting its related project.
- Select any applicable published `video_categories` through `categories`.
  Category names and sort values are editable; published slugs remain stable.
  Roofing Projects (`roofing-project`) is derived from the project relationship;
  Other (`other`) is derived when no relationship or published category exists.
  Those reserved slugs cannot be ordinary categories. Overlapping assignments
  match every assigned category without duplicating the video in the library.
- Video and project publication are independent. A published video linked to
  an unpublished project keeps its copy, selection link, and Roofing Projects
  classification; it exposes no project link, material, or location. Its sitemap
  destination becomes the library selection URL. Unpublishing a video removes
  it from the library and project player while leaving the project page intact.
- `published_at` controls newest-first website chronology. True YouTube upload
  dates are separate metadata; absence of a verified upload date never causes
  the website timestamp to be presented as YouTube's upload date.
- Projects and videos share the private `.generated/projects.json` artifact.
  Save CMS changes, complete a successful build, and deploy it to publish.
  The library, player lookup, resources API, project players, and video sitemap
  have no ISR, runtime CMS refresh, or WordPress fallback. Revalidation cannot
  publish CMS changes. YouTube playback itself remains an external service.
- Keep `external_id`, `source_updated_at`, `legacy_ids`, `youtube_id`, and
  `scope_key` automation-owned. Existing GraphQL IDs and `project-<slug>` aliases
  keep shared links working independently of later project changes. Import time
  and initial publication do not replace the verified source modified date.
- Archive metadata remains in the `/video-library` `website_pages` record.
  Sharing from the player copies the stable library selection URL. Eligible
  project cards retain their project link; the modal keeps its existing layout.
- See [the migration tooling guide](docs/video-migration.md) for source exports,
  schema invariants, recovery, and verification. The homepage/About placements
  and the excluded truck-sale page retain the code-owned boundary above.

## Publishing SonShine people in Directus

- Directus is the only frontend source for the ten approved profiles.
  WordPress person queries and fallback images are intentionally not supported.
- The approved order is Nathan Borntreger, Bob, Josh, JB, Jeremy K., Tara, Mina,
  Michael, Erick, and José. Antonio, Tony, Angela, Dean, Steve, and Matthew are
  explicitly excluded and must not be recreated by the migration script.
- `show_on_team` defaults to true. `noindex` defaults to true globally; keep it
  false for approved profiles that should be publicly indexable. Records still
  require the correct
  SonShine client, slug, display name, role, biography, sort value, and described
  profile image.
- `bio` allows only paragraphs, H2–H4 headings, links, bold/italic emphasis,
  ordered/unordered lists, list items, and line breaks. The frontend sanitizer
  is authoritative; images, media, tables, code, classes, IDs, colors, inline
  styles, scripts, and arbitrary source HTML are unsupported.
- Person SEO is stored explicitly in Directus, including the independently
  reviewed focus keywords. Display name/role, cleaned biography text, and the
  described profile image remain fallback sources only.

## Publishing sponsor features in Directus

- Published records are client-scoped and sorted by `sort`, then `title`.
  Homepage and location-page partnership cards have no WordPress fallback.
- Each record requires `slug`, `title`, restricted `description` HTML, and a
  logo with a non-empty Directus file description. Optional website, Facebook,
  and Instagram fields must use absolute HTTP(S) URLs.
- `service_area_slugs` is an optional JSON string list. The location adapter
  returns up to eight matching records when at least four exist. Otherwise it
  appends the configured leading entries from the full sorted pool—six in the
  current homepage and location routes—and removes duplicate slugs.
- `description` allows paragraphs, links, bold/italic emphasis, ordered or
  unordered lists, list items, and line breaks. The frontend sanitizer removes
  images, unsafe links, classes, styles, scripts, and unsupported markup.
- The partnership heading and introductory copy remain code-owned. Directus
  changes use the build-driven content path and require a new site build to
  appear publicly.

## Publishing roofing glossary terms in Directus

- Directus is the only frontend glossary source; there is no WordPress fallback.
- Every record requires the SonShine client, `status`, a client-scoped URL-safe
  `slug`, `title`, restricted `definition` HTML, and database-maintained
  `scope_key`.
- Keep `noindex=true` on every glossary term. The `/roofing-glossary` archive
  remains indexable through its separate `website_pages` record, while the
  glossary sitemap emits only terms whose own `noindex` value is false.
- `definition` allows paragraphs, links, bold/italic emphasis, inline code,
  superscript/subscript, ordered/unordered lists, list items, and line breaks.
  Images, headings, tables, classes, IDs, styles, scripts, and arbitrary source
  markup are unsupported; the frontend sanitizer is authoritative.
- Directus `date_updated` is the authoritative freshness timestamp for any
  glossary term that is later made indexable and emitted in the sitemap.

## Publishing special offers in Directus

- Set `status=published` to make an offer routable.
- Set `featured=true` to make an unexpired offer eligible for the sitewide popup.
- Popup route suppression is code-owned in
  `components/lead-capture/special-offer/SpecialOfferPopup.tsx`; Directus cannot
  override the excluded lead, legal, review, offer, or confirmation routes.
- New offers default to `noindex=true`; editors may turn indexing on. The stored
  toggle alone controls robots metadata and special-offer sitemap inclusion.
  Expiration disables the claim form and featured-popup eligibility, but does
  not override indexing.
- Use `featured_image.description` for image alt text and `legal_disclaimer` for disclaimer copy.
- Special-offer content is build-only. Publish a new site build for Directus
  changes to reach the public offer route or its sitemap entry.

## Publishing legal copy in Directus

- Edit `legal_copy.privacy_policy` and `legal_copy.terms_of_use` with the WYSIWYG editor.
- Use semantic HTML without classes, IDs, inline styles, scripts, or event-handler attributes.
- Begin body headings at `h2`; the Next.js page shell owns the primary `h1`.
- `/privacy-policy` consumes `privacy_policy`; `/sms-terms-and-conditions` consumes `terms_of_use`.

## Glossary linking

- Term pages auto-link other terms in the content body (first occurrence per term).
- Avoid keyword stuffing; links are budgeted to prevent overlinking.

## Images

- For brand images, prefer Next.js `Image` component where possible.
- Prefer the described `site_settings.default_og_image` for shared Open Graph
  fallbacks. [SEO.md](SEO.md) is the canonical guide for the tracked local
  fallback asset and its cache-versioned metadata URL.

## Repository migration artifacts

- Files under `docs/*.sql` are privileged Directus database migration and
  verification artifacts, not local setup commands. They may depend on
  already-applied database state and require explicit Directus write approval.
- `docs/directus-route-owner-invariants.sql` is the canonical shared
  client/route scope-key invariant for fixed pages, services, posts, offers,
  people, and glossary terms.
- The retained person and blog migration scripts require historical JSON inputs
  that are not tracked in a clean checkout. Do not treat their package commands
  as routine validation.
