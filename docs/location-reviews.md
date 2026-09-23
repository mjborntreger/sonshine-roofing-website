# Manual location reviews

Directus owns editorial location reviews. Editors maintain content, location and
publication directly, then deploy a new website build to publish the snapshot.

- Preserve attribution, actual rating, source link, owner reply and original date.
  Leave an unknown date null.
- Manual reviews keep `external_id` null. That field and source timestamps remain
  reserved for real Google review identity and the active **SRI Latest Reviews
  Catcher -> Directus** workflow. Never fabricate an identity or duplicate a match.
- Location pages select published, five-star, same-client reviews with a matching
  service area. Sitewide Google reviews additionally require their verified Google
  identity. Project testimonials remain independent.
- The completed import contributed 72 approved five-star reviews; the temporary
  `wordpress_provenance` field is retired. Canonical review facts and links remain.
- The active Google workflow and its operational fields are preserved. This cleanup
  does not change its definitions, publish it, or execute it as a test.

See [location authoring](location-authoring.md), [CONTENT.md](../CONTENT.md) and
[DEPLOY.md](../DEPLOY.md). Historical import decisions remain in Git history.
