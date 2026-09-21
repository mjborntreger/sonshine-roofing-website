# September 18 location-page update

The owner approved the reviewed location-page changes and community-scene image
candidates after the September 17 planning and PDF review. The owner confirmed
reuse permission for the 20 candidates without an explicit license and requested
archiving Port Charlotte Section 15. Gulf Gate East retains its CC BY-SA 2.0
attribution. The five remaining missing images will be supplied by the owner.

## Applied CMS changes

- The five published location hubs use `The BEST Roofing Company in ${location}
  for Over 39 Years` as their CMS-owned hero title. Other SEO and publication
  fields are unchanged.
- Twenty-one approved images are imported and linked to their neighborhood
  records. Fresh target checks and relation/metadata readback passed. The existing
  image workflow optimized 20 files to WebP. On September 21, Saralake Estates
  was linked to a verified 1600 × 1067 WebP derivative after the 15 MB original
  timed out in the website image optimizer. The derivative retains the approved
  composition and permission; the original JPEG remains available for recovery.
  Original and resulting hashes and visual comparisons are retained outside Git.
- Port Charlotte Section 15 is archived, leaving 112 published neighborhoods and
  two archived records. Existing project relationships are retained.
- Charleston Park, Regency Oaks Preserve, Chaparral, Pleasant Acres, and Siesta's
  Bayside remain published without images for the owner to supply.

The image review and import receipts remain outside this application repository.
Source permission was confirmed by the owner; no permission requests were sent.
No workflow, lead integration, or source WordPress record was changed.

## Application behavior

The location hero highlights `BEST` and `Over 39 Years` using the homepage style.
Locations reuse the homepage's six service cards with a local heading. Major
sections have subtitles and highlighted heading text, with relevant service trust
pills. Neighborhood project links have a `Featured Projects:` heading and bullets.

Homepage and location reviews share the same carousel renderer. Locations show
all eligible local reviews and fill only a shortfall below six from directly
approved nearby areas. They appear in one carousel without separate nearby labels.
Each review retains its actual area, date, attribution, and original link. The
homepage Google feed and location snapshot remain separate data sources.

Photo credits come from an explicit public metadata allowlist. Raw EXIF,
provenance, and workflow metadata do not enter the location snapshot. Gulf Gate
East displays its source, creator, license, and WebP-conversion notice.

## Validation and release status

All 25 Quality workflow commands passed on Node 22.23.2, including 15 carousel
fixtures and the updated location pipeline/component checks. A credentialed
production-configured build (`NEXT_PUBLIC_ENV=production`) passed on September 21
with 456 generated pages, 443 validated route owners, 53 projects, 79 videos,
333 gallery images, and 112 published neighborhoods.

The final HTTP/SSR acceptance run passed 244 of 244 checks: all five heroes,
shared service cards, combined review counts, project bullets, 13 FAQs per hub,
canonical/indexability rules, neighborhood image mappings and attribution,
location/image sitemaps, and unknown/taxonomy-only 404 responses. The Saralake
derivative returned HTTP 200 through the rendered Next image-optimizer URL.
The location snapshot digest is
`87d4c6709be2cd87738c528a8a23c6ff5dd6ac50311849f9abe89da6a51e4795`.

Desktop and mobile browser review covered the homepage and five location hubs.
The final browser pass confirmed the repaired photo, visible Gulf Gate East
credit, project bullets, shared homepage cards and Google carousel, six unified
Lakewood Ranch reviews, review-dialog Escape/focus restoration, all 13 FAQ
expansions, and client navigation. No forms were submitted.

The code is a release candidate. CMS content becomes public through a subsequent
deployed snapshot; these CMS edits do not update the already deployed pages.
Deployment and its public acceptance checks remain pending authorization.
