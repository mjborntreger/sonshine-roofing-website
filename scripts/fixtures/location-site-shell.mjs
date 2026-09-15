/** Synthetic raw Directus responses; no production identities or customer data. */
export function makeSiteShellFixture(clientSlug = 'fixture-client') {
  const file = (id, type = 'image/webp') => ({ id, description: `Synthetic ${id} description`, width: 1200, height: 750, type });
  const siteSettings = [{
    id: 'settings-fixture', client: { slug: clientSlug },
    brand_name: 'Fixture Roofing', brand_legal_name: 'Fixture Roofing Company',
    brand_slogan: 'Synthetic brand slogan', brand_description: 'Synthetic company description.',
    phone: '555-555-0100', email: 'fixture@example.com', site_url: 'https://example.com/',
    logo: file('logo'), logo_inverted: file('logo-inverted'), favicon: file('favicon'), default_og_image: file('social'),
    hero_image: file('hero-image'), hero_video: file('hero-video', 'video/mp4'),
    address_street: '100 Example Street', address_city: 'Example City', address_region: 'FL', address_postal_code: '00000', address_country: 'US',
    facebook: 'https://example.com/facebook', instagram: null, youtube: null, nextdoor: null, yelp: null, pinterest: null,
    x_twitter: null, google_business_profile: null,
    schema_type: 'RoofingContractor', price_range: '$$', opening_hours: [{ opening_hours: 'Mo-Fr 09:00-17:00' }],
    robots_disallow: [{ rule: '/private' }], content_security_policy: "default-src 'self';  img-src 'self' https:;",
    footer_include_legal: true, footer_include_socials: true, footer_include_services: true, enable_site_analytics: false,
    public_location: null, founding_date: '2000-01-01', license_number: 'SYNTHETIC', license_url: 'https://example.com/license',
    payment_methods: [{ payment_method: 'Credit card', href: null }], languages_served: [{ language: 'English' }],
    timezone: 'America/New_York', brands_used: [{ brand: 'Fixture materials', href: 'https://example.com/materials' }],
    discounts: [], services: [{ service: 'Roof repair', href: '/roof-repair' }], associations: [], llms_txt: 'Fixture only.\n',
    badges: [{ footer_badges_id: { id: 'badge-fixture', client: { slug: clientSlug }, badge: file('badge-image'), href: 'https://example.com/badge', sort_order: 1 } }],
  }];
  const service = (slug, sortOrder) => ({
    id: `service-${slug}`, client: { slug: clientSlug }, status: 'published', slug, nav_label: `Fixture ${slug}`,
    intro: `Synthetic ${slug} introduction.`, lucide_icon: 'House', sort_order: sortOrder, noindex: false,
    meta_title: `Fixture ${slug} title`, meta_description: `Fixture ${slug} metadata.`, primary_focus_keyword: 'Roofing',
    focus_keywords: ['Repair', 'roofing', 'ROOFING'], og_title: null, og_description: null, og_image_override: null,
  });
  return { siteSettings, services: [service('roof-repair', 2), service('roof-replacement', 1)] };
}
